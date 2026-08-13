require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./models/Task');
const connectDB = require('./config/db');

const tasks = [
  {
    title: 'Machine Learning Assignment',
    description: 'Complete the python implementation of random forest and submit the report.',
    category: 'Assignment',
    tags: ['ML', 'Python', 'Report'],
    priority: 'HIGH',
    priorityScore: 3,
    status: 'TODO',
    dueDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    estimatedMinutes: 180,
    source: 'university_portal'
  },
  {
    title: 'DBMS Assignment',
    description: 'Write SQL queries for the given schema and normalize tables to 3NF.',
    category: 'Assignment',
    tags: ['SQL', 'Database', 'Normalization'],
    priority: 'MEDIUM',
    priorityScore: 2,
    status: 'IN_PROGRESS',
    dueDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    estimatedMinutes: 120,
    source: 'manual'
  },
  {
    title: 'Computer Networks Preparation',
    description: 'Study OSI model, TCP/IP, and routing algorithms for the upcoming mid-sem.',
    category: 'Study',
    tags: ['CN', 'Exam'],
    priority: 'HIGH',
    priorityScore: 3,
    status: 'TODO',
    dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    estimatedMinutes: 300,
    source: 'manual'
  },
  {
    title: 'Automata Theory Lab',
    description: 'Implement a DFA to accept strings ending with 011.',
    category: 'Lab',
    tags: ['TOC', 'C++'],
    priority: 'MEDIUM',
    priorityScore: 2,
    status: 'COMPLETED',
    dueDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    completedAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
    estimatedMinutes: 60,
    source: 'university_portal'
  },
  {
    title: 'Web Development Project',
    description: 'Design the frontend dashboard using React and Tailwind CSS.',
    category: 'Project',
    tags: ['React', 'Frontend', 'Web'],
    priority: 'HIGH',
    priorityScore: 3,
    status: 'IN_PROGRESS',
    dueDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    estimatedMinutes: 600,
    source: 'manual'
  },
  {
    title: 'C++ Practical',
    description: 'Complete the operator overloading and polymorphism lab exercises.',
    category: 'Lab',
    tags: ['C++', 'OOP'],
    priority: 'LOW',
    priorityScore: 1,
    status: 'TODO',
    dueDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    estimatedMinutes: 90,
    source: 'manual'
  },
  {
    title: 'Semester Presentation',
    description: 'Prepare PPT slides for the final year project review.',
    category: 'Presentation',
    tags: ['Project', 'PPT'],
    priority: 'HIGH',
    priorityScore: 3,
    status: 'TODO',
    dueDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    estimatedMinutes: 150,
    source: 'manual'
  },
  {
    title: 'Internal Exam Preparation',
    description: 'Revise all subjects for the upcoming internal exams next month.',
    category: 'Study',
    tags: ['Exams', 'Revision'],
    priority: 'MEDIUM',
    priorityScore: 2,
    status: 'TODO',
    dueDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    estimatedMinutes: 1200,
    source: 'manual'
  },
  {
    title: 'Overdue OS Assignment',
    description: 'Submit the shell script assignment.',
    category: 'Assignment',
    tags: ['OS', 'Shell'],
    priority: 'HIGH',
    priorityScore: 3,
    status: 'OVERDUE',
    dueDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    estimatedMinutes: 60,
    source: 'university_portal'
  }
];

const seedDB = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Task.deleteMany();
    console.log('Database cleared!');

    // Insert new data
    await Task.insertMany(tasks);
    console.log('Demo data seeded successfully!');

    process.exit();
  } catch (error) {
    console.error(`Error with seeding data: ${error}`);
    process.exit(1);
  }
};

seedDB();
