const STORAGE_KEY = 'nodirjon-task-manager-v1';

const defaultTasks = [
  {
    id: crypto.randomUUID(),
    title: 'Bugungi vazifalarni yozish',
    done: false,
    priority: 'Yuqori',
    category: 'Ish',
    deadline: todayOffset(0),
    createdAt: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Mijozga javob berish',
    done: true,
    priority: 'O‘rta',
    category: 'Aloqa',
    deadline: todayOffset(1),
    createdAt: Date.now() - 1,
  },
  {
    id: crypto.randomUUID(),
    title: 'Hisobotni tekshirish',
    done: false,
    priority: 'Past',
    category: 'Moliya',
    deadline: todayOffset(3),
    createdAt: Date.now() - 2,
  },
];

const state = {
  tasks: loadTasks(),
  filter: 'all',
  search: '',
};

const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const totalCount = document.getElementById('totalCount');
const doneCount = document.getElementById('doneCount');
const overdueCount = document.getElementById('overdueCount');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');

render();

function todayOffset(offset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTasks;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultTasks;
  } catch {
    return defaultTasks;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function formatDeadline(value) {
  if (!value) return 'Deadline yo‘q';
  const date = new Date(value + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return 'Deadline yo‘q';
  return new Intl.DateTimeFormat('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getDeadlineStatus(deadline, done) {
  if (!deadline) return 'none';
  if (done) return 'done';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(deadline + 'T00:00:00');
  date.setHours(0, 0, 0, 0);

  if (date.getTime() < today.getTime()) return 'overdue';
  if (date.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

function createBadge(text, extraClass = '') {
  const span = document.createElement('span');
  span.className = `badge ${extraClass}`.trim();
  span.textContent = text;
  return span;
}

function getFilteredTasks() {
  const query = state.search.trim().toLowerCase();

  return state.tasks.filter(task => {
    const matchesFilter =
      state.filter === 'all' ? true : state.filter === 'done' ? task.done : !task.done;
    const matchesSearch = task.title.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
}

function render() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = '';

  filtered.forEach(task => {
    const card = document.createElement('article');
    card.className = 'task-card';

    const left = document.createElement('div');
    left.className = 'task-main';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const content = document.createElement('div');
    const title = document.createElement('p');
    title.className = `task-title ${task.done ? 'done' : ''}`;
    title.textContent = task.title;

    const badges = document.createElement('div');
    badges.className = 'badges';

    const priorityClass =
      task.priority === 'Yuqori'
        ? 'priority-high'
        : task.priority === 'O‘rta'
          ? 'priority-medium'
          : 'priority-low';

    badges.appendChild(createBadge(task.priority, priorityClass));
    badges.appendChild(createBadge(task.category));

    const deadlineStatus = getDeadlineStatus(task.deadline, task.done);
    if (task.deadline) {
      const deadlineText =
        deadlineStatus === 'overdue'
          ? `Kechikdi: ${formatDeadline(task.deadline)}`
          : deadlineStatus === 'today'
            ? `Bugun: ${formatDeadline(task.deadline)}`
            : `Deadline: ${formatDeadline(task.deadline)}`;

      const deadlineClass =
        deadlineStatus === 'overdue'
          ? 'deadline-overdue'
          : deadlineStatus === 'today'
            ? 'deadline-today'
            : deadlineStatus === 'done'
              ? 'deadline-done'
              : '';

      badges.appendChild(createBadge(deadlineText, deadlineClass));
    }

    content.appendChild(title);
    content.appendChild(badges);
    left.appendChild(checkbox);
    left.appendChild(content);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.type = 'button';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.setAttribute('aria-label', 'Vazifani o‘chirish');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    card.appendChild(left);
    card.appendChild(deleteBtn);
    taskList.appendChild(card);
  });

  emptyState.classList.toggle('hidden', filtered.length > 0);
  updateStats();
}

function updateStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter(task => task.done).length;
  const overdue = state.tasks.filter(task => getDeadlineStatus(task.deadline, task.done) === 'overdue').length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  totalCount.textContent = String(total);
  doneCount.textContent = String(done);
  overdueCount.textContent = String(overdue);
  progressText.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;
}

function addTask(formData) {
  const title = formData.get('title').trim();
  if (!title) return;

  const task = {
    id: crypto.randomUUID(),
    title,
    done: false,
    priority: formData.get('priority'),
    category: formData.get('category'),
    deadline: formData.get('deadline'),
    createdAt: Date.now(),
  };

  state.tasks.unshift(task);
  saveTasks();
  render();
}

function toggleTask(id) {
  state.tasks = state.tasks.map(task =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  saveTasks();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(task => task.id !== id);
  saveTasks();
  render();
}

taskForm.addEventListener('submit', event => {
  event.preventDefault();
  addTask(new FormData(taskForm));
  taskForm.reset();
  document.getElementById('priority').value = 'O‘rta';
  document.getElementById('category').value = 'Ish';
});

searchInput.addEventListener('input', event => {
  state.search = event.target.value;
  render();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle('active', item === button));
    render();
  });
});

clearCompletedBtn.addEventListener('click', () => {
  const hasCompleted = state.tasks.some(task => task.done);
  if (!hasCompleted) return;
  state.tasks = state.tasks.filter(task => !task.done);
  saveTasks();
  render();
});
