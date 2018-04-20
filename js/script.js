/* @author Agulescu Andrei (andrei.agulescu@gmail.com) */

// We use this key to store the entries in the browsr's local storage
const LS_KEY = 'yeelight';

/*
 * Create a new alert element and return the object.
 * If the alert structure changes, just reimplement this function
 */

function newAlert(message, type) {
    var alertContainer = newElement('div');
    alertContainer.classList.add('alert');
    alertContainer.classList.add('alert-' + type);

    var alertTitle = newElement('h3');
    alertTitle.innerHTML = type[0].toUpperCase() + type.substring(1);

    var alertMessage = newElement('p');
    alertMessage.innerHTML = message;

    alertContainer.appendChild(alertTitle);
    alertContainer.appendChild(alertMessage);

    return alertContainer;
}

/*
 * Creates and then displays the alert. Thsi functions does
 * not create the alert element on its own, instead it delegates
 * the creation to another function.
 */

function showAlert(message, type) {
    var container = $('alert-container');
    clear(container);
    container.appendChild(newAlert(message, type));
    setTimeout(() => clear(container), 3000);
}

/*
 * Reads the form input values and attempts to save them.
 * Validation is also performed (checks the values and makes sure they're not empty).
 * 
 * For a more thorough validation, we can use reqular expressions and refine the process.
 */

function saveFormInput() {
    var nameInput = $('name').value;
    var keyInput = $('key').value;
    var actionInput = $('action').value;

    // validation
    if (!nameInput) {
        showAlert('Name cannot be empty!', 'warning');
        return;
    }

    if (!keyInput) {
        showAlert('Key cannot be empty!', 'warning');
        return;
    }

    if (!actionInput) {
        showAlert('Action cannot be empty!', 'warning');
        return;
    }

    // Everything is saved in local storage as a JSON object
    saveToLocalStorage(nameInput, keyInput, actionInput);
}


/*
 * This function takes a name, key and action and attepts to save it to the browser's local
 * storage object.
 * 
 * If an item exists with the same action value, it display an alert informing the user
 * and requesting appropriate action.
 * 
 * If an entry with the same name exists, it will update its values instead of creating a new one.
 */

function saveToLocalStorage(name, key, action) {

    var content = localStorage.getItem(LS_KEY);

    if (content) {
        content = JSON.parse(content);
    } else {
        content = [];
    }

    var actionEntry = content.find((entry) => entry.action === action);
    var nameEntry = content.find((entry) => entry.name === name);

    if (actionEntry) {
        showAlert('An item already exists for this action', 'error');
        return;
    }

    if (nameEntry) {
        nameEntry.name = name;
        nameEntry.action = action;
        nameEntry.key = key;
        content = content.filter((entry) => entry !== nameEntry);
        content.push(nameEntry);
    } else {
        content.push({ name: name, action: action, key: key });
    }

    localStorage.setItem(LS_KEY, JSON.stringify(content));
    renderList();
    showAlert('Saved successfully!', 'success');
    switchToView('listing');
}

/*
 * Thsi function attempts to render the list of items stored in local storage.
 * 
 * There was also an issue where after the user would edit or delete one item,
 * the state would get corrupted because the list is re-rendered each time
 * an item is modified/added/removed.
 * 
 * Te edit button would still indicate that we are in edit mode but we would not see the
 * appropriate actions on the list items.
 */

function renderList() {
    var listEntries = localStorage.getItem(LS_KEY);

    if (!listEntries) {
        return;
    }

    listEntries = JSON.parse(listEntries);

    var listContainer = $('list-container');
    clear(listContainer);

    listEntries.forEach((entry) => listContainer.appendChild(newListEntry(entry)));

    // After we rerender the list,
    // check the edit button. If the list was rendered because the user
    // changed it by editing/deleting an item, restore that state
    var editButton = $('edit-item');
    if (editButton.classList.contains('btn-primary')) {
        editButton.classList.remove('btn-primary');
        showEditOptions();
    }
}

/*
 * Creates the list entry. Basically it just creates the skeleton of a list entry and
 * populates it with the information contained in the enty object.
 */

function newListEntry(entry) {
    var listEntry = newElement('li');
    var listText = newElement('span');
    var actionContainer = newElement('div');
    var runButton = createIconButton('power-off', true, null, entry, _run);
    var editButton = createIconButton('edit', true, null, entry, _edit);
    var deleteButton = createIconButton('trash', true, null, entry, _delete);
    listText.innerHTML = entry.name;
    actionContainer.appendChild(runButton);
    actionContainer.appendChild(editButton);
    actionContainer.appendChild(deleteButton);
    listEntry.appendChild(listText);
    listEntry.appendChild(actionContainer);
    return listEntry;
}

/*
 * Handy function for creating buttons and assigning callbacks to them.
 * This function also binds data to the callback
 * (i tried using the data-* attributes but they never worked correctly).
 */

function createIconButton(iconClass, isRound, text, data, callback) {
    var button = newElement('button');
    button.classList.add('btn');

    if (isRound) {
        button.classList.add('btn-round');
    }

    button.innerHTML = '<i class="fas fa-' + iconClass + '"></i>'

    if (text) {
        button.innerHTML += text;
    }

    if (callback) {
        button.addEventListener('click', () => callback.apply(data));
    }

    return button;
}

/*
 * 'Runs' an action whenever the user clicks on the power toggle icon.
 */

function _run() {
    let url = 'https://maker.ifttt.com/trigger/' + this.action + '/with/key/' + this.key;

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', url, true);
    // xmlhttp.onreadystatechange = (e) => { console.log(e); };
    xmlhttp.send();
}

/*
 * Edits an item on the list
 */

function _edit() {
    $('name').value = this.name;
    $('key').value = this.key;
    $('action').value = this.action;
    switchToView('edit-form');
}

/*
 * Deletes an item on the list
 */

function _delete() {
    var content = JSON.parse(localStorage.getItem(LS_KEY));
    content = content.filter((entry) => !(this.name === entry.name && this.key === entry.key && this.action === entry.action));
    localStorage.setItem(LS_KEY, JSON.stringify(content));
    renderList();
}

/*
 * Function removes all child nodes of an element. This is used when we re-render the list of to hide
 * the alerts after a certain period of time has passed.
 */

function clear(list) {
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }
}

/*
 * When we clicn the add button, we just show the edit form and hide everything else.
 */

function addNewItem() { switchToView('edit-form'); }

/*
 * This function switches between different views. Not the best way to do it but it's simple and
 * works for this small app.
 */

function switchToView(view) {
    switch (view) {
        case 'edit-form': showElement(['edit-form']); hideElement(['listing', 'main-controls']); break;
        case 'listing': hideElement(['edit-form']); showElement(['listing', 'main-controls']); renderList(); break;
    }
}

/*
 * Hide a bunch of elements by adding the .hidden class.
 * This class just sets the display property to none.
 */

function hideElement(ids) {
    ids.forEach((id) => addClass(id, 'hidden'));
}

/*
 * Shows a bunch of elements by removing the .hidden class.
 */

function showElement(ids) {
    ids.forEach((id) => removeClass(id, 'hidden'));
}

/*
 * This function is responsible for showing the edit/delete options on the list items.
 * It's also making the edit button green to indicate that were in 'edit mode'.
 */

function showEditOptions() {
    var ac = document.querySelectorAll('#list-container > li > div');

    var editButton = $('edit-item');

    if (!editButton.classList.contains('btn-primary')) {
        Array
            .from(ac)
            .forEach((c) => c.classList.add('show-all-options'));

        editButton.classList.add('btn-primary');

    } else {
        Array
            .from(ac)
            .forEach((c) => c.classList.remove('show-all-options'));

        editButton.classList.remove('btn-primary');
    }
}

// Go back to the main listing

function cancelForm() { switchToView('listing'); }

/*
 * -----------------------------------------
 *       Small utility functions
 * -----------------------------------------
 */

// Get the element from an id

function $(id) {
    return document.getElementById(id);
}

// Add a class to an element

function addClass(id, clazz) {
    $(id).classList.add(clazz);
}

// Remove a class from an element

function removeClass(id, clazz) {
    $(id).classList.remove(clazz);
}

// Create a new element

function newElement(name) {
    return document.createElement(name);
}
