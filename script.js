/* =========================================
   1. SELECT HTML ELEMENTS
========================================= */

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeBtn = document.getElementById("themeBtn");


/* =========================================
   2. LOAD TASKS FROM LOCAL STORAGE
========================================= */

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("tasks");

        if (savedTasks === null) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        return Array.isArray(parsedTasks) ? parsedTasks : [];
    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}

let tasks = loadTasks();

let currentFilter = "all";
let searchTerm = "";


/* =========================================
   3. SAVE TASKS TO LOCAL STORAGE
========================================= */

function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
        alert("Your changes could not be saved in this browser.");
    }
}


/* =========================================
   4. CREATE A UNIQUE TASK ID
========================================= */

function createTaskId() {
    if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}


/* =========================================
   5. ADD A NEW TASK
========================================= */

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const priority = priorityInput.value;
    const dueDate = dueDateInput.value;

    // Validate the title.
    if (!title) {
        alert("Please enter a task title.");
        taskTitle.focus();
        return;
    }

    // Create a task object.
    const newTask = {
        id: createTaskId(),
        title: title,
        description: description,
        completed: false,
        priority: priority,
        dueDate: dueDate,
        createdAt: new Date().toISOString()
    };

    // Add the task to the array.
    tasks.push(newTask);

    // Save and update the interface.
    saveTasks();
    renderTasks();

    // Clear the form.
    taskForm.reset();
    taskTitle.focus();
});


/* =========================================
   6. RENDER TASKS INTO THE DOM
========================================= */

function renderTasks() {
    // Clear the old rendered list.
    taskList.replaceChildren();

    // Apply search and filter rules.
    const visibleTasks = tasks.filter(function (task) {
        const matchesSearch = [
            task.title,
            task.description
        ].some(function (value) {
            return (value || "")
                .toLowerCase()
                .includes(searchTerm);
        });

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "pending" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        return matchesSearch && matchesFilter;
    });

    // Display an empty message when necessary.
    if (visibleTasks.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-message";
        emptyMessage.textContent = tasks.length === 0
            ? "No tasks yet. Add your first task!"
            : "No tasks match your search or filter.";

        taskList.appendChild(emptyMessage);
    }

    // Create a card for every visible task.
    visibleTasks.forEach(function (task) {
        const card = document.createElement("article");
        card.className = "task-card";

        if (task.completed) {
            card.classList.add("completed");
        }

        // Task heading and checkbox.
        const heading = document.createElement("div");
        heading.className = "task-heading";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.title} as completed`
        );

        checkbox.addEventListener("change", function () {
            toggleTask(task.id);
        });

        const title = document.createElement("h3");
        title.textContent = task.title;

        heading.append(checkbox, title);

        // Task description.
        const description = document.createElement("p");
        description.className = "task-description";
        description.textContent =
            task.description || "No description provided.";

        // Task metadata.
        const metadata = document.createElement("div");
        metadata.className = "task-metadata";

        const priorityBadge = document.createElement("span");
        priorityBadge.className =
            `priority-badge priority-${task.priority}`;
        priorityBadge.textContent =
            `${capitalize(task.priority)} priority`;

        const statusBadge = document.createElement("span");
        statusBadge.className = "status-badge";
        statusBadge.textContent = task.completed
            ? "Completed"
            : "Pending";

        metadata.append(priorityBadge, statusBadge);

        if (task.dueDate) {
            const dateBadge = document.createElement("span");
            dateBadge.className = "date-badge";
            dateBadge.textContent = `Due: ${task.dueDate}`;
            metadata.appendChild(dateBadge);
        }

        // Edit and delete buttons.
        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editTask(task.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            deleteTask(task.id);
        });

        actions.append(editButton, deleteButton);

        // Assemble the task card.
        card.append(heading, description, metadata, actions);
        taskList.appendChild(card);
    });

    updateTaskCounters();
}


/* =========================================
   7. COMPLETE OR UNCOMPLETE A TASK
========================================= */

function toggleTask(id) {
    tasks = tasks.map(function (task) {
        if (task.id === id) {
            return {
                ...task,
                completed: !task.completed
            };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}


/* =========================================
   8. DELETE A TASK
========================================= */

function deleteTask(id) {
    const shouldDelete = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!shouldDelete) {
        return;
    }

    tasks = tasks.filter(function (task) {
        return task.id !== id;
    });

    saveTasks();
    renderTasks();
}


/* =========================================
   9. EDIT A TASK
========================================= */

function editTask(id) {
    const task = tasks.find(function (item) {
        return item.id === id;
    });

    if (!task) {
        return;
    }

    const newTitle = prompt("Edit task title:", task.title);

    // Cancel was clicked.
    if (newTitle === null) {
        return;
    }

    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
        alert("Task title cannot be empty.");
        return;
    }

    const newDescription = prompt(
        "Edit task description:",
        task.description
    );

    if (newDescription === null) {
        return;
    }

    const updatedTasks = tasks.map(function (item) {
        if (item.id === id) {
            return {
                ...item,
                title: trimmedTitle,
                description: newDescription.trim()
            };
        }

        return item;
    });

    tasks = updatedTasks;

    saveTasks();
    renderTasks();
}


/* =========================================
   10. SEARCH TASKS
========================================= */

searchInput.addEventListener("input", function () {
    searchTerm = searchInput.value.trim().toLowerCase();

    renderTasks();
});


/* =========================================
   11. FILTER TASKS
========================================= */

/* =========================================
   11. FILTER TASKS — FIXED
========================================= */

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {

        // Read the filter name from a data attribute.
        currentFilter = button.dataset.filter;

        // Update active button styling.
        filterButtons.forEach(function (btn) {
            btn.classList.toggle("active", btn === button);
        });

        // Render tasks using the selected filter.
        renderTasks();
    });
});



/* =========================================
   12. UPDATE TASK COUNTERS
========================================= */

function updateTaskCounters() {
    const total = tasks.length;

    const completed = tasks.filter(function (task) {
        return task.completed;
    }).length;

    const pending = total - completed;

    // Add counters to the filter buttons.
    filterButtons.forEach(function (button) {
        const filter = button.textContent
            .trim()
            .toLowerCase()
            .split(" ")[0];

        let count = total;

        if (filter === "pending") {
            count = pending;
        } else if (filter === "completed") {
            count = completed;
        }

        const baseLabel = capitalize(filter);
        button.textContent = `${baseLabel} (${count})`;
    });
}


/* =========================================
   13. HELPER FUNCTION
========================================= */

function capitalize(value) {
    if (!value) {
        return "";
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}


/* =========================================
   14. DARK MODE
========================================= */

themeBtn.addEventListener("click", function () {
    const isDark = document.body.classList.toggle("dark-mode");

    themeBtn.textContent = isDark ? "☀️" : "🌙";

    try {
        localStorage.setItem("taskTheme", isDark ? "dark" : "light");
    } catch (error) {
        console.error("Could not save theme:", error);
    }
});

try {
    const savedTheme = localStorage.getItem("taskTheme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeBtn.textContent = "☀️";
    }
} catch (error) {
    console.error("Could not load theme:", error);
}


/* =========================================
   15. INITIAL RENDER
========================================= */

// Display saved tasks as soon as the page loads.
renderTasks();

