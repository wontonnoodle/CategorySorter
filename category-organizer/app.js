(function () {
  'use strict';

  // ===== Constants =====
  const STORAGE_KEY = 'categoryOrganizerData';
  const DEBOUNCE_MS = 500;

  // ===== Default Data =====
  const DEFAULT_DATA = {
    categories: [
      {
        id: 'cat-1',
        name: 'Example Category 1',
        order: 0,
        subcategories: [
          { id: 'sub-1', name: 'Example Subcategory A', order: 0 },
          { id: 'sub-2', name: 'Example Subcategory B', order: 1 },
        ],
      },
      {
        id: 'cat-2',
        name: 'Example Category 2',
        order: 1,
        subcategories: [
          { id: 'sub-3', name: 'Example Subcategory C', order: 0 },
        ],
      },
    ],
  };

  // ===== State =====
  let data = loadData();
  let saveTimeout = null;
  const sortableInstances = new Map();

  // ===== DOM References =====
  const categoriesList = document.getElementById('categoriesList');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const toast = document.getElementById('toast');

  // ===== Initialization =====
  render();
  addCategoryBtn.addEventListener('click', addCategory);

  // ===== Data Persistence =====

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.categories)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load data from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  function saveData() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save data:', e);
        showToast('Failed to save. Storage may be full.');
      }
    }, DEBOUNCE_MS);
  }

  // ===== Rendering =====

  function render() {
    // Destroy existing sortable instances
    sortableInstances.forEach(function (instance) {
      instance.destroy();
    });
    sortableInstances.clear();

    categoriesList.innerHTML = '';

    // Sort categories by order
    data.categories.sort(function (a, b) { return a.order - b.order; });

    data.categories.forEach(function (category) {
      categoriesList.appendChild(createCategoryElement(category));
    });

    initCategorySortable();
  }

  function createCategoryElement(category) {
    var li = document.createElement('li');
    li.className = 'category-item';
    li.dataset.id = category.id;

    // Category row
    var row = document.createElement('div');
    row.className = 'category-row';

    // Drag handle
    var handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '\u2630'; // ☰
    handle.title = 'Drag to reorder';

    // Name
    var name = document.createElement('span');
    name.className = 'category-name';
    name.textContent = category.name;
    name.title = 'Click to edit';
    setupInlineEdit(name, category, 'name');

    // Actions
    var actions = document.createElement('span');
    actions.className = 'category-actions';

    var addSubBtn = document.createElement('button');
    addSubBtn.className = 'btn btn-icon add-sub';
    addSubBtn.textContent = '+';
    addSubBtn.title = 'Add subcategory';
    addSubBtn.addEventListener('click', function () {
      addSubcategory(category.id);
    });

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-icon delete';
    deleteBtn.textContent = '\u00d7'; // ×
    deleteBtn.title = 'Delete category';
    deleteBtn.addEventListener('click', function () {
      deleteCategory(category.id);
    });

    actions.appendChild(addSubBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(handle);
    row.appendChild(name);
    row.appendChild(actions);

    // Subcategories list
    var subList = document.createElement('ul');
    subList.className = 'subcategories-list';
    subList.dataset.categoryId = category.id;

    // Sort subcategories by order
    category.subcategories.sort(function (a, b) { return a.order - b.order; });

    category.subcategories.forEach(function (sub) {
      subList.appendChild(createSubcategoryElement(sub, category.id));
    });

    li.appendChild(row);
    li.appendChild(subList);

    // Init sortable for subcategory list
    initSubcategorySortable(subList);

    return li;
  }

  function createSubcategoryElement(sub, categoryId) {
    var li = document.createElement('li');
    li.className = 'subcategory-item';
    li.dataset.id = sub.id;

    var row = document.createElement('div');
    row.className = 'subcategory-row';

    var bullet = document.createElement('span');
    bullet.className = 'subcategory-bullet';
    bullet.textContent = '\u2022'; // •

    var name = document.createElement('span');
    name.className = 'subcategory-name';
    name.textContent = sub.name;
    name.title = 'Click to edit';

    // Find the category object for inline editing
    var category = data.categories.find(function (c) { return c.id === categoryId; });
    setupInlineEdit(name, sub, 'name', category);

    var actions = document.createElement('span');
    actions.className = 'subcategory-actions';

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-icon delete';
    deleteBtn.textContent = '\u00d7'; // ×
    deleteBtn.title = 'Delete subcategory';
    deleteBtn.addEventListener('click', function () {
      deleteSubcategory(categoryId, sub.id);
    });

    actions.appendChild(deleteBtn);

    row.appendChild(bullet);
    row.appendChild(name);
    row.appendChild(actions);

    li.appendChild(row);
    return li;
  }

  // ===== Inline Editing =====

  function setupInlineEdit(element, item, property) {
    var originalValue = '';

    element.addEventListener('click', function () {
      if (element.contentEditable === 'true') return;
      originalValue = item[property];
      element.contentEditable = 'true';
      element.focus();

      // Select all text
      var range = document.createRange();
      range.selectNodeContents(element);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    element.addEventListener('blur', function () {
      element.contentEditable = 'false';
      var newValue = element.textContent.trim();

      if (!newValue) {
        element.textContent = originalValue;
        showToast('Name cannot be empty.');
        return;
      }

      if (newValue !== originalValue) {
        item[property] = newValue;
        saveData();
      }
    });

    element.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        element.blur();
      }
      if (e.key === 'Escape') {
        element.textContent = originalValue;
        element.blur();
      }
    });
  }

  // ===== Sortable Setup =====

  function initCategorySortable() {
    var instance = Sortable.create(categoriesList, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd: function () {
        // Read new order from DOM
        var items = categoriesList.querySelectorAll(':scope > .category-item');
        items.forEach(function (el, index) {
          var cat = data.categories.find(function (c) { return c.id === el.dataset.id; });
          if (cat) cat.order = index;
        });
        saveData();
      },
    });
    sortableInstances.set('categories', instance);
  }

  function initSubcategorySortable(listEl) {
    var instance = Sortable.create(listEl, {
      group: 'subcategories',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd: function (evt) {
        handleSubcategoryMove(evt);
      },
    });
    sortableInstances.set(listEl.dataset.categoryId, instance);
  }

  function handleSubcategoryMove(evt) {
    var subId = evt.item.dataset.id;
    var fromCategoryId = evt.from.dataset.categoryId;
    var toCategoryId = evt.to.dataset.categoryId;

    var fromCategory = data.categories.find(function (c) { return c.id === fromCategoryId; });
    var toCategory = data.categories.find(function (c) { return c.id === toCategoryId; });

    if (!fromCategory || !toCategory) return;

    // Find and remove the subcategory from source
    var subIndex = fromCategory.subcategories.findIndex(function (s) { return s.id === subId; });
    if (subIndex === -1) return;
    var sub = fromCategory.subcategories.splice(subIndex, 1)[0];

    // Insert into target at new index
    toCategory.subcategories.splice(evt.newIndex, 0, sub);

    // Update orders for both affected categories
    updateSubcategoryOrders(fromCategory);
    updateSubcategoryOrders(toCategory);

    saveData();
  }

  function updateSubcategoryOrders(category) {
    category.subcategories.forEach(function (sub, index) {
      sub.order = index;
    });
  }

  // ===== CRUD Operations =====

  function addCategory() {
    var newCategory = {
      id: crypto.randomUUID(),
      name: 'New Category',
      order: data.categories.length,
      subcategories: [],
    };
    data.categories.push(newCategory);
    saveData();
    render();

    // Focus the new category name for editing
    var newEl = categoriesList.querySelector(
      '.category-item[data-id="' + newCategory.id + '"] .category-name'
    );
    if (newEl) {
      newEl.click();
    }
  }

  function addSubcategory(categoryId) {
    var category = data.categories.find(function (c) { return c.id === categoryId; });
    if (!category) return;

    var newSub = {
      id: crypto.randomUUID(),
      name: 'New Subcategory',
      order: category.subcategories.length,
    };
    category.subcategories.push(newSub);
    saveData();
    render();

    // Focus the new subcategory name for editing
    var newEl = categoriesList.querySelector(
      '.subcategory-item[data-id="' + newSub.id + '"] .subcategory-name'
    );
    if (newEl) {
      newEl.click();
    }
  }

  function deleteCategory(categoryId) {
    var category = data.categories.find(function (c) { return c.id === categoryId; });
    if (!category) return;

    if (category.subcategories.length > 0) {
      var confirmed = confirm(
        'Category "' + category.name + '" has ' + category.subcategories.length +
        ' subcategor' + (category.subcategories.length === 1 ? 'y' : 'ies') +
        '. Delete it and all its subcategories?'
      );
      if (!confirmed) return;
    }

    data.categories = data.categories.filter(function (c) { return c.id !== categoryId; });

    // Re-order remaining categories
    data.categories.forEach(function (cat, index) {
      cat.order = index;
    });

    saveData();
    render();
  }

  function deleteSubcategory(categoryId, subId) {
    var category = data.categories.find(function (c) { return c.id === categoryId; });
    if (!category) return;

    category.subcategories = category.subcategories.filter(function (s) { return s.id !== subId; });
    updateSubcategoryOrders(category);

    saveData();
    render();
  }

  // ===== Toast Notifications =====

  var toastTimeout = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toast.classList.remove('visible');
    }, 2500);
  }
})();
