document.addEventListener('DOMContentLoaded', () => {
  const state = {
    todo: [],
    progress: [],
    done: []
  };

  const columns = {
    todo: document.querySelector('#todo-tasks'),
    progress: document.querySelector('#progress-tasks'),
    done: document.querySelector('#done-tasks')
  };

  const addCardButtons = document.querySelectorAll('.add-card');
  const cardForms = document.querySelectorAll('.card-form');
  const textareas = document.querySelectorAll('.card-textarea');
  const submitButtons = document.querySelectorAll('.submit-btn');
  const cancelButtons = document.querySelectorAll('.cancel-btn');

  function loadState() {
    const savedState = localStorage.getItem('trelloState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      Object.assign(state, parsedState);
      
      for (const column in state) {
        state[column].forEach(taskText => {
          createTask(taskText, column);
        });
      }
    }
  }

  function saveState() {
    for (const column in columns) {
      state[column] = Array.from(columns[column].children)
        .filter(el => !el.classList.contains('placeholder'))
        .map(task => task.querySelector('.task-text').textContent);
    }
    localStorage.setItem('trelloState', JSON.stringify(state));
  }

  function createTask(text, column) {
    const task = document.createElement('div');
    task.className = 'task';
    
    const taskText = document.createElement('div');
    taskText.className = 'task-text';
    taskText.textContent = text;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    
    task.appendChild(taskText);
    task.appendChild(closeBtn);
    columns[column].appendChild(task);
    
    task.addEventListener('mousedown', handleMouseDown);
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      task.remove();
      saveState();
    });
    
    return task;
  }

  let dragging = null;
  let placeholder = null;
  let startX = 0;
  let startY = 0;

  function handleMouseDown(e) {
    if (e.button !== 0 || e.target.classList.contains('close-btn')) return;

    const actualEl = e.target.closest('.task');
    if (!actualEl) return;

    dragging = actualEl;
    const rect = dragging.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.style.width = `${dragging.offsetWidth}px`;
    placeholder.style.height = `${dragging.offsetHeight}px`;
    dragging.parentNode.insertBefore(placeholder, dragging);

    dragging.classList.add('dragging');
    dragging.style.left = `${rect.left}px`;
    dragging.style.top = `${rect.top}px`;
    dragging.style.width = `${rect.width}px`;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e) {
    if (!dragging) return;

    dragging.style.left = `${e.clientX - startX}px`;
    dragging.style.top = `${e.clientY - startY}px`;

    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const hoveredTask = elements.find(el => el.classList.contains('task') && el !== dragging);
    const hoveredList = elements.find(el => el.classList.contains('tasks'));

    if (hoveredTask) {
      const rect = hoveredTask.getBoundingClientRect();
      const dropY = e.clientY - rect.top;
      
      if (placeholder.parentNode !== hoveredTask.parentNode) {
        hoveredTask.parentNode.insertBefore(placeholder, hoveredTask);
      }
      
      if (dropY > rect.height / 2) {
        if (hoveredTask.nextSibling !== placeholder) {
          hoveredTask.parentNode.insertBefore(placeholder, hoveredTask.nextSibling);
        }
      } else {
        if (hoveredTask.previousSibling !== placeholder) {
          hoveredTask.parentNode.insertBefore(placeholder, hoveredTask);
        }
      }
    } else if (hoveredList && !hoveredTask) {
      if (placeholder.parentNode !== hoveredList) {
        hoveredList.appendChild(placeholder);
      }
    }
  }

  function handleMouseUp() {
    if (!dragging) return;

    dragging.style.position = '';
    dragging.style.left = '';
    dragging.style.top = '';
    dragging.style.width = '';
    dragging.classList.remove('dragging');

    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(dragging, placeholder);
      placeholder.parentNode.removeChild(placeholder);
    }

    dragging = null;
    placeholder = null;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    saveState();
  }

  addCardButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      btn.style.display = 'none';
      cardForms[index].style.display = 'flex';
      textareas[index].focus();
    });
  });

  cancelButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      cardForms[index].style.display = 'none';
      addCardButtons[index].style.display = 'flex';
      textareas[index].value = '';
    });
  });

  submitButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const text = textareas[index].value.trim();
      if (text) {
        const column = btn.closest('.column').dataset.column;
        createTask(text, column);
        saveState();
      }
      cardForms[index].style.display = 'none';
      addCardButtons[index].style.display = 'flex';
      textareas[index].value = '';
    });
  });

  loadState();
});