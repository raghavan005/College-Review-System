require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const College = require('../src/models/College');
const Review = require('../src/models/Review');

// --- Seed Data ---

const users = [
  { name: 'Admin User', email: 'admin@college.com', password: 'Admin@1234', role: 'admin' },
  { name: 'Prof. Alice Johnson', email: 'alice@college.com', password: 'Teacher@1234', role: 'teacher' },
  { name: 'Prof. Bob Williams', email: 'bob@college.com', password: 'Teacher@1234', role: 'teacher' },
  { name: 'Student Charlie', email: 'charlie@college.com', password: 'Student@1234', role: 'student' },
  { name: 'Student Diana', email: 'diana@college.com', password: 'Student@1234', role: 'student' },
  { name: 'Student Eve', email: 'eve@college.com', password: 'Student@1234', role: 'student' },
];

const colleges = [
  {
    name: 'PSG College of Technology',
    location: 'Coimbatore, TN',
    description: 'A leading engineering and technology institution in Coimbatore.',
    website: 'https://www.psgtech.edu',
    established: 1951,
  },
  {
    name: 'Coimbatore Institute of Technology',
    location: 'Coimbatore, TN',
    description: 'Engineering college known for strong academics and campus culture.',
    website: 'https://www.cit.edu.in',
    established: 1956,
  },
  {
    name: 'Amrita Vishwa Vidyapeetham (Coimbatore)',
    location: 'Coimbatore, TN',
    description: 'Multi-disciplinary university campus with strong research focus.',
    website: 'https://www.amrita.edu',
    established: 2003,
  },
  {
    name: 'Massachusetts Institute of Technology',
    location: 'Cambridge, MA',
    description: 'A world-renowned research university known for science and technology.',
    website: 'https://www.mit.edu',
    established: 1861,
  },
  {
    name: 'Stanford University',
    location: 'Stanford, CA',
    description: 'A leading research university near Silicon Valley.',
    website: 'https://www.stanford.edu',
    established: 1885,
  },
  {
    name: 'Harvard University',
    location: 'Cambridge, MA',
    description: 'One of the oldest and most prestigious universities in the world.',
    website: 'https://www.harvard.edu',
    established: 1636,
  },
  {
    name: 'California Institute of Technology',
    location: 'Pasadena, CA',
    description: 'A private research university focused on science and engineering.',
    website: 'https://www.caltech.edu',
    established: 1891,
  },
  {
    name: 'University of Michigan',
    location: 'Ann Arbor, MI',
    description: 'A top public research university with a vibrant campus community.',
    website: 'https://umich.edu',
    established: 1817,
  },
];

// Reviews: [collegeIndex, userIndex, rating, title, body]
const reviewsData = [
  [0, 3, 5, 'Incredible STEM programs', 'MIT offers some of the most rigorous and rewarding STEM programs in the world. The faculty are brilliant and always accessible.'],
  [0, 4, 4, 'Challenging but rewarding', 'The workload at MIT is intense, but the skills you gain and the network you build are unmatched anywhere else.'],
  [0, 1, 5, 'Exceptional research opportunities', 'As a visiting professor, I was blown away by the research infrastructure and collaborative spirit at MIT.'],
  [1, 3, 5, 'Dream university', 'Stanford has an amazing campus, outstanding professors, and an entrepreneurial culture that pushes you to build the next big thing.'],
  [1, 5, 4, 'Great all-around experience', 'Beautiful campus, strong academics, and endless opportunities for networking. The weather alone makes it worth it.'],
  [1, 2, 5, 'Ideal for interdisciplinary research', 'Stanford encourages collaboration across departments. My joint project between engineering and medicine was a highlight.'],
  [2, 4, 4, 'Rich academic tradition', "Harvard's history and prestige are real. The alumni network is unparalleled and the libraries are world-class."],
  [2, 5, 3, 'Great but very competitive', 'Harvard is excellent but extremely competitive. You need to be self-motivated to thrive here. Classes can feel impersonal.'],
  [2, 1, 5, 'Unmatched academic prestige', 'Teaching and studying at Harvard has been a career-defining experience. The caliber of students and staff is exceptional.'],
  [3, 3, 5, 'Small but elite', 'Caltech has a small student body but every single person is brilliant. The professor-to-student ratio is fantastic.'],
  [3, 5, 4, 'Physics and engineering heaven', 'If you love hardcore science, Caltech is the place. The Jet Propulsion Lab access is a unique bonus.'],
  [4, 4, 4, 'Best public university experience', 'U of M has huge school spirit, excellent academics, and tons of extracurricular options. Highly recommend for in-state students.'],
  [4, 5, 3, 'Good but large class sizes', 'The university is great overall, but some intro courses have 500+ students and it can be hard to get individual attention.'],
  [4, 2, 4, 'Strong engineering department', 'The engineering college at U of M is top-notch. I had access to modern labs and supportive faculty throughout my time there.'],
  [0, 5, 3, 'High pressure environment', 'MIT pushes you to your limits. The culture is intense and not for everyone, but those who adapt come out transformed.'],
];

// --- Main Seed Function ---

const seed = async () => {
  try {
    await connectDB();
    console.log('\nStarting database seed...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      College.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('Cleared existing data.');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users:`);
    createdUsers.forEach((u) => console.log(`   - [${u.role}] ${u.name} <${u.email}>`));

    const adminUser = createdUsers.find((u) => u.role === 'admin');

    // Create colleges
    const collegesWithCreatedBy = colleges.map((c) => ({ ...c, createdBy: adminUser._id }));
    const createdColleges = await College.create(collegesWithCreatedBy);
    console.log(`\nCreated ${createdColleges.length} colleges:`);
    createdColleges.forEach((c) => console.log(`   - ${c.name} (${c.location})`));

    // Create reviews
    const reviewDocs = reviewsData.map(([colIdx, userIdx, rating, title, body]) => ({
      college: createdColleges[colIdx]._id,
      author: createdUsers[userIdx]._id,
      role: createdUsers[userIdx].role,
      rating,
      title,
      body,
    }));

    const createdReviews = await Review.create(reviewDocs);
    console.log(`\nCreated ${createdReviews.length} reviews.`);

    // Summary per college
    console.log('\nCollege Review Summary:');
    for (const college of createdColleges) {
      const reviews = await Review.find({ college: college._id });
      const avg =
        reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 'N/A';
      console.log(`   - ${college.name}: ${reviews.length} reviews, avg rating: ${avg}`);
    }

    console.log('\nSeed complete!\n');
    console.log('Login credentials:');
    console.log('   Admin:   admin@college.com    / Admin@1234');
    console.log('   Teacher: alice@college.com    / Teacher@1234');
    console.log('   Student: charlie@college.com  / Student@1234');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
