// Wait for the DOM to be fully loaded before running any script
document.addEventListener("DOMContentLoaded", () => {
  // --- TO-DO LIST APPLICATION LOGIC ---

  // Get references to all necessary HTML elements
  const inputBox = document.getElementById("input-box");
  const dateBox = document.getElementById("date-box");
  const timeBox = document.getElementById("time-box");
  const addButton = document.getElementById("add-button");
  const listContainer = document.getElementById("list-container");

  // Load tasks from localStorage, or initialize an empty array if none are found
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // --- DATA MANAGEMENT ---

  // Function to save the current 'tasks' array to localStorage
  const saveTasks = () => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  };

  // --- RENDERING ---

  // Function to render all tasks to the screen
  const renderTasks = () => {
    listContainer.innerHTML = ""; // Clear the existing list first

    if (tasks.length === 0) {
      // Display a message if there are no tasks
      listContainer.innerHTML = `<li style="justify-content: center; color: #6b7280;">Your to-do list is empty!</li>`;
      return;
    }

    tasks.forEach((task, index) => {
      const li = document.createElement("li");
      if (task.completed) {
        li.classList.add("completed");
      }
      li.dataset.index = index; // Store the task's index for easy access

      const taskDateTime =
        task.date && task.time
          ? `<p style="font-size: 0.75rem; color: #9ca3af;">Due: ${new Date(
              task.date + "T" + task.time
            ).toLocaleString()}</p>`
          : "";

      const timerDisplay =
        task.endTime && task.timerActive
          ? `<div class="task-timer"></div>`
          : "";

      // Use image tags for the icons
      const checkImageSrc = task.completed
        ? "images/check.png"
        : "images/uncheck.png";

      li.innerHTML = `
                <button class="complete-btn">
                    <img src="${checkImageSrc}" alt="toggle complete" width="24">
                </button>
                <div class="task-text">
                    <p>${task.text}</p>
                    ${taskDateTime}
                    ${timerDisplay}
                </div>
                <button class="delete-btn">
                    <img src="images/delete.png" alt="delete" width="20">
                </button>
            `;
      listContainer.appendChild(li);
    });
  };

  // --- CORE LOGIC ---

  // Function to add a new task
  const addTask = () => {
    const taskText = inputBox.value.trim();
    if (taskText === "") {
      inputBox.classList.add("invalid-input");
      setTimeout(() => inputBox.classList.remove("invalid-input"), 500);
      return;
    }

    const taskDateInput = dateBox.value;
    const taskTime = timeBox.value;
    let effectiveDate = taskDateInput;

    // If time is set but date is not, default to today
    if (taskTime && !effectiveDate) {
      const today = new Date();
      effectiveDate = today.toISOString().split("T")[0];
    }

    const newTask = {
      text: taskText,
      date: effectiveDate,
      time: taskTime,
      completed: false,
    };

    // Set up timer if a date and time are provided and within 24 hours
    if (effectiveDate && taskTime) {
      const targetDateTime = new Date(`${effectiveDate}T${taskTime}`);
      const diffInMillis = targetDateTime.getTime() - new Date().getTime();
      if (diffInMillis > 0 && diffInMillis < 24 * 60 * 60 * 1000) {
        newTask.endTime = targetDateTime.getTime();
        newTask.timerActive = true;
      }
    }

    tasks.unshift(newTask); // Add new task to the beginning of the array
    inputBox.value = dateBox.value = timeBox.value = "";
    saveTasks();
    renderTasks();
  };

  // --- EVENT LISTENERS ---
  addButton.addEventListener("click", addTask);
  inputBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  listContainer.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const index = parseInt(li.dataset.index, 10);

    // Handle completing/un-completing a task
    if (e.target.closest(".complete-btn")) {
      tasks[index].completed = !tasks[index].completed;
      // Deactivate timer if completed, reactivate if un-completed and time is left
      if (tasks[index].completed) {
        tasks[index].timerActive = false;
      } else if (
        tasks[index].endTime &&
        tasks[index].endTime > new Date().getTime()
      ) {
        tasks[index].timerActive = true;
      }
    }

    // Handle deleting a task
    if (e.target.closest(".delete-btn")) {
      tasks.splice(index, 1);
    }

    saveTasks();
    renderTasks();
  });

  // --- TIMER LOGIC ---

  const updateTimers = () => {
    let shouldRerender = false;
    const now = new Date().getTime();
    const twentyFourHoursInMillis = 24 * 60 * 60 * 1000;

    // Check if any future tasks need their timers activated
    tasks.forEach((task) => {
      if (task.date && task.time && !task.completed && !task.timerActive) {
        const targetDateTime = new Date(`${task.date}T${task.time}`);
        const diffInMillis = targetDateTime.getTime() - now;
        if (diffInMillis > 0 && diffInMillis < twentyFourHoursInMillis) {
          task.endTime = targetDateTime.getTime();
          task.timerActive = true;
          shouldRerender = true;
        }
      }
    });

    if (shouldRerender) {
      saveTasks();
      renderTasks();
      return; // Exit after re-rendering to prevent conflicts
    }

    // Update the display for active timers
    document.querySelectorAll("#list-container li").forEach((li) => {
      const index = li.dataset.index;
      if (index === undefined) return;
      const task = tasks[index];

      if (task && task.endTime && task.timerActive) {
        const timerEl = li.querySelector(".task-timer");
        if (!timerEl) return;
        const remainingTime = task.endTime - now;

        if (remainingTime > 0) {
          const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
          const seconds = Math.floor((remainingTime / 1000) % 60);
          timerEl.textContent = `Time left: ${String(hours).padStart(
            2,
            "0"
          )}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
            2,
            "0"
          )}`;
        } else {
          timerEl.textContent = "Time's up!";
          task.timerActive = false;
          li.classList.add("timer-finished");
          saveTasks(); // Save the deactivated timer state
          setTimeout(() => li.classList.remove("timer-finished"), 3000);
        }
      }
    });
  };

  // --- INITIALIZATION ---
  renderTasks(); // Initial render of tasks on load
  setInterval(updateTimers, 1000); // Check and update timers every second
});
