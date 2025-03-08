import './App.css';
import { useState } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState('');

  const addTask = () => {
    if (task.trim() === '') return;
    setTasks([...tasks, task]);
    setTask('');
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((t, i) => i !== index));
  };

  return (
    <div style={{ textAlign: 'center', margin: '50px' }}>
      <h2>To-Do List</h2>
      <input
        type='text'
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder='Enter a task'
      />
      <button onClick={addTask}>Add Task</button>
      <ul>
        {tasks.map((t, index) => (
            <li key={index}>
              {t} <button onClick={() => removeTask(index)}>Delete</button>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default App;
