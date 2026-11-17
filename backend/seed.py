"""Populate the local demo database. Run: python seed.py"""
import os
from datetime import datetime, timezone
import bcrypt
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
db = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))[os.getenv("DATABASE_NAME", "student_skill_platform")]
password_hash = bcrypt.hashpw(b"SkillUp2025!", bcrypt.gensalt()).decode()

branches = ["Computer Engineering", "Information Science", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering"]
users = []
for role, entries in {
    "admin": [("Avery Admin", "admin@example.com")],
    "faculty": [("Dr. Maya Chen", "faculty@example.com"), ("Arjun Rao", "faculty2@example.com"), ("Sara Williams", "faculty3@example.com")],
    "student": [("Alex Morgan", "student@example.com"), ("Sam Taylor", "sam@example.com"), ("Jordan Lee", "jordan@example.com"), ("Riya Patel", "riya@example.com"), ("Dev Shah", "dev@example.com"), ("Nina Kumar", "nina@example.com"), ("Aarav Singh", "aarav@example.com"), ("Mia Fernandez", "mia@example.com"), ("Noah Wilson", "noah@example.com"), ("Isha Rao", "isha@example.com")]
}.items():
    for index, (name, email) in enumerate(entries):
        doc = {"name": name, "email": email, "password": password_hash, "role": role, "active": True, "createdAt": datetime.now(timezone.utc)}
        if role == "student":
            doc.update({"usn": f"SKILL{index+1:03}", "college": "Northstar College of Engineering", "department": "Computer Science", "branch": branches[index % len(branches)], "semester": str(index % 8 + 1), "phone": "+1 555 0142", "bio": "Curious learner building practical skills and meaningful projects.", "github": "https://github.com", "linkedin": "https://linkedin.com", "skills": [{"name": "JavaScript", "level": "Intermediate", "progress": 68}, {"name": "React", "level": "Beginner", "progress": 35}, {"name": "Communication", "level": "Advanced", "progress": 82}], "portfolioSlug": name.lower().replace(" ", "-"), "streak": 7, "points": 850})
        users.append(doc)
for item in users:
    db.users.update_one({"email": item["email"]}, {"$setOnInsert": item}, upsert=True)

skills = [("Python", "Technical"), ("JavaScript", "Technical"), ("React", "Technical"), ("Node.js", "Technical"), ("MongoDB", "Technical"), ("Data Structures", "Technical"), ("Machine Learning", "Technical"), ("SQL", "Technical"), ("HTML & CSS", "Technical"), ("Git & GitHub", "Technical"), ("Communication", "Soft Skills"), ("Leadership", "Soft Skills"), ("Teamwork", "Soft Skills"), ("Problem Solving", "Soft Skills"), ("Time Management", "Soft Skills"), ("UI/UX Design", "Design"), ("Figma", "Design"), ("Graphic Design", "Design"), ("Cloud Computing", "Technical"), ("Cyber Security", "Technical")]
for name, category in skills:
    db.skills.update_one({"name": name}, {"$setOnInsert": {"name": name, "category": category, "description": f"Develop practical {name} skills through guided learning and projects.", "difficulty": "Beginner", "createdAt": datetime.now(timezone.utc)}}, upsert=True)

courses = [
    {"title": "Full Stack Web Development", "category": "Development", "difficulty": "Intermediate", "duration": "8 weeks", "instructor": "Dr. Maya Chen", "rating": 4.9, "enrollmentCount": 1240, "description": "Build modern web apps from interface to database with a hands-on capstone.", "skills": ["React", "Node.js", "MongoDB"], "modules": ["HTML & CSS foundations", "JavaScript essentials", "React fundamentals", "State and routing", "APIs with Node.js", "MongoDB data modeling", "Authentication", "Final portfolio project"], "published": True, "color": "violet"},
    {"title": "Python for Data Science", "category": "Data Science", "difficulty": "Beginner", "duration": "6 weeks", "instructor": "Arjun Rao", "rating": 4.8, "enrollmentCount": 860, "description": "Learn Python, data wrangling, visualization, and your first predictive model.", "skills": ["Python", "SQL", "Machine Learning"], "modules": ["Python essentials", "Working with data", "Pandas toolkit", "Data visualization", "Intro to ML", "Mini project"], "published": True, "color": "blue"},
    {"title": "Product Design with Figma", "category": "Design", "difficulty": "Beginner", "duration": "4 weeks", "instructor": "Sara Williams", "rating": 4.7, "enrollmentCount": 590, "description": "Turn product ideas into polished, accessible prototypes and design systems.", "skills": ["UI/UX Design", "Figma", "Communication"], "modules": ["Design thinking", "Research and personas", "Wireframes", "Figma foundations", "Prototyping", "Portfolio case study"], "published": True, "color": "pink"},
    {"title": "Mastering Data Structures", "category": "Computer Science", "difficulty": "Advanced", "duration": "5 weeks", "instructor": "Dr. Maya Chen", "rating": 4.9, "enrollmentCount": 1044, "description": "Build confidence with core algorithms and interview-ready problem solving.", "skills": ["Data Structures", "Problem Solving", "Python"], "modules": ["Complexity analysis", "Arrays and strings", "Stacks and queues", "Trees and graphs", "Dynamic programming"], "published": True, "color": "orange"},
    {"title": "Cloud Foundations", "category": "Cloud", "difficulty": "Beginner", "duration": "3 weeks", "instructor": "Arjun Rao", "rating": 4.6, "enrollmentCount": 430, "description": "Explore cloud concepts, deployment, and modern infrastructure basics.", "skills": ["Cloud Computing", "Git & GitHub"], "modules": ["Cloud concepts", "Virtual infrastructure", "Deploy a web app", "Security basics"], "published": True, "color": "cyan"},
    {"title": "Confident Communication", "category": "Career Skills", "difficulty": "Beginner", "duration": "2 weeks", "instructor": "Sara Williams", "rating": 4.8, "enrollmentCount": 712, "description": "Practice presentations, clear writing, and collaborative communication.", "skills": ["Communication", "Leadership", "Teamwork"], "modules": ["Know your audience", "Present with confidence", "Feedback and collaboration"], "published": True, "color": "green"}
]
for course in courses:
    db.courses.update_one({"title": course["title"]}, {"$setOnInsert": {**course, "createdAt": datetime.now(timezone.utc)}}, upsert=True)

challenges = [
    ("Build a Portfolio Website", "Create a responsive personal portfolio to showcase your journey.", "Intermediate", "7 days", 100),
    ("Solve 20 DSA Problems", "Practice algorithms and share your learning notes.", "Advanced", "14 days", 200),
    ("Design a Campus Event Poster", "Create a vibrant poster for a student event.", "Beginner", "3 days", 50),
    ("Build a Weather App", "Use a public API to build a clean forecast dashboard.", "Intermediate", "5 days", 100),
    ("30-Day Learning Streak", "Make progress on a skill every day for a month.", "Beginner", "30 days", 250),
    ("Create a Data Story", "Turn a public dataset into a clear visual story.", "Intermediate", "7 days", 150),
    ("Open Source First PR", "Contribute a useful fix or documentation update.", "Intermediate", "10 days", 200),
    ("Pitch a Product Idea", "Present a solution to a real campus problem.", "Beginner", "4 days", 75),
    ("Cyber Safety Checklist", "Create a student-friendly cyber security guide.", "Beginner", "5 days", 75),
    ("Build a Study Planner", "Design and build a simple planner for your peers.", "Intermediate", "10 days", 150)
]
for title, description, difficulty, duration, points in challenges:
    db.challenges.update_one({"title": title}, {"$setOnInsert": {"title": title, "description": description, "difficulty": difficulty, "duration": duration, "points": points, "deadline": "2026-12-31", "createdAt": datetime.now(timezone.utc)}}, upsert=True)

resources = [("React Documentation", "Official interactive React learning guide", "Documentation", "https://react.dev/learn", "React", "Beginner"), ("Python Tutorial", "Python language tutorial and reference", "Documentation", "https://docs.python.org/3/tutorial/", "Python", "Beginner"), ("JavaScript Guide", "A comprehensive guide to JavaScript", "Article", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "JavaScript", "Intermediate"), ("MongoDB University", "Free courses for MongoDB developers", "Course", "https://learn.mongodb.com/", "MongoDB", "Beginner"), ("freeCodeCamp", "Hands-on projects across web development", "Practice", "https://www.freecodecamp.org/learn/", "HTML & CSS", "Beginner"), ("Figma Learn", "Learn design basics and Figma workflows", "Video", "https://help.figma.com/hc/en-us/categories/360002051613-Learn-design", "Figma", "Beginner"), ("LeetCode", "Practice coding interview problems", "Practice", "https://leetcode.com/", "Data Structures", "Advanced"), ("Git Handbook", "A friendly guide to Git", "Article", "https://guides.github.com/introduction/git-handbook/", "Git & GitHub", "Beginner"), ("Khan Academy Statistics", "Build confidence in statistics", "Course", "https://www.khanacademy.org/math/statistics-probability", "Machine Learning", "Beginner"), ("Google Cloud Skills Boost", "Hands-on cloud learning paths", "Practice", "https://www.cloudskillsboost.google/", "Cloud Computing", "Intermediate")]
for title, description, kind, url, skill, difficulty in resources:
    db.resources.update_one({"title": title}, {"$setOnInsert": {"title": title, "description": description, "type": kind, "url": url, "skill": skill, "difficulty": difficulty, "createdAt": datetime.now(timezone.utc)}}, upsert=True)

badges = [("First Course Completed", "Complete your first learning path", "🏆"), ("5 Skills Added", "Add five skills to your profile", "🎯"), ("7-Day Learning Streak", "Learn for seven days in a row", "🔥"), ("First Challenge", "Complete your first challenge", "💡"), ("Skill Master", "Reach expert level in a skill", "⭐")]
for name, description, icon in badges:
    db.badges.update_one({"name": name}, {"$setOnInsert": {"name": name, "description": description, "icon": icon}}, upsert=True)

student = db.users.find_one({"email": "student@example.com"})
uid = str(student["_id"])
for course in db.courses.find().limit(3):
    db.enrollments.update_one({"student": uid, "course": str(course["_id"])}, {"$setOnInsert": {"student": uid, "course": str(course["_id"]), "progress": 63, "completedModules": course.get("modules", [])[:4], "enrolledAt": datetime.now(timezone.utc)}}, upsert=True)
for title, org, skill, status in [("Python Essentials", "Northstar Learning", "Python", "Verified"), ("Design Foundations", "Open Design School", "UI/UX Design", "Pending Verification")]:
    db.certificates.update_one({"student": uid, "title": title}, {"$setOnInsert": {"student": uid, "title": title, "organization": org, "skill": skill, "issueDate": "2026-04-12", "status": status, "file": "", "createdAt": datetime.now(timezone.utc)}}, upsert=True)
for title, description, technologies in [("Campus Connect", "A hub to discover campus events and meet collaborators.", ["React", "MongoDB"]), ("Study Buddy", "A lightweight study planner for focused learning.", ["JavaScript", "CSS"])]:
    db.projects.update_one({"student": uid, "title": title}, {"$setOnInsert": {"student": uid, "title": title, "description": description, "technologies": technologies, "github": "https://github.com", "liveDemo": "", "createdAt": datetime.now(timezone.utc)}}, upsert=True)
print(f"Seeded {db.users.count_documents({})} users, {db.skills.count_documents({})} skills, {db.courses.count_documents({})} courses, and demo records.")
print("Demo password for all accounts: SkillUp2025!")
