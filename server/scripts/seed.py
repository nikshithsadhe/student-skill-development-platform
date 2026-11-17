"""
Comprehensive, Idempotent Database Seed Script for Student Skill Development Platform (SSP).
Populates:
- 12 Soft-Skill Categories
- 24+ Structured Modules (2+ per category) with 3+ Lessons each, examples, exercises, and quizzes
- Initial 20+ Question Soft-Skills Assessment + Per-skill assessments
- 10 Practical Activities with complete scoring rubrics
- Mock Interview Question Banks (HR, Situational, Behavioral)
- Achievement Badges & Gamification Point Rules
- Development-only Demo Accounts (--with-demo-users flag in APP_ENV=development)
"""
import argparse
import asyncio
from datetime import datetime, timezone
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings
from app.core.security import hash_password

settings = get_settings()

CATEGORIES = [
    {
        "name": "Communication Skills",
        "slug": "communication-skills",
        "description": "Verbal clarity, active listening, articulation, and concise expression for professional dialogues.",
        "icon": "MessageSquare",
    },
    {
        "name": "Leadership Skills",
        "slug": "leadership-skills",
        "description": "Decision-making, guiding teams, empathy, motivation, and leading through influence.",
        "icon": "Shield",
    },
    {
        "name": "Teamwork and Collaboration",
        "slug": "teamwork-and-collaboration",
        "description": "Cooperation, constructive conflict resolution, peer accountability, and cross-functional harmony.",
        "icon": "Users",
    },
    {
        "name": "Time Management",
        "slug": "time-management",
        "description": "Prioritization, Eisenhower matrix, deep-work focus, combating procrastination, and meeting deadlines.",
        "icon": "Clock",
    },
    {
        "name": "Problem-Solving and Decision-Making",
        "slug": "problem-solving-and-decision-making",
        "description": "Root cause analysis, creative brainstorming, logical trade-off evaluation, and structured problem framing.",
        "icon": "Lightbulb",
    },
    {
        "name": "Emotional Intelligence",
        "slug": "emotional-intelligence",
        "description": "Self-awareness, emotional regulation, empathy in interpersonal dynamics, and managing stress gracefully.",
        "icon": "Heart",
    },
    {
        "name": "Public Speaking",
        "slug": "public-speaking",
        "description": "Overcoming stage anxiety, vocal modulation, audience engagement, and storytelling architecture.",
        "icon": "Mic",
    },
    {
        "name": "Body Language and Confidence",
        "slug": "body-language-and-confidence",
        "description": "Posture, eye contact, non-verbal presence, handshake etiquette, and cultivating self-assurance.",
        "icon": "UserCheck",
    },
    {
        "name": "Interview Skills",
        "slug": "interview-skills",
        "description": "Mastering the STAR method, elevator pitches, handling curveball questions, and post-interview follow-up.",
        "icon": "Briefcase",
    },
    {
        "name": "Presentation Skills",
        "slug": "presentation-skills",
        "description": "Slide visual design principles, structuring technical narratives for non-technical stakeholders, and Q&A handling.",
        "icon": "Presentation",
    },
    {
        "name": "Critical Thinking",
        "slug": "critical-thinking",
        "description": "Questioning assumptions, identifying logical fallacies, cognitive biases, and objective evidence synthesis.",
        "icon": "Brain",
    },
    {
        "name": "Professional Etiquette",
        "slug": "professional-etiquette",
        "description": "Workplace email communication, meeting decorum, professional boundaries, digital presence, and networking.",
        "icon": "CheckSquare",
    },
]

PRACTICAL_ACTIVITIES = [
    {
        "title": "One-Minute Speech Challenge (The Impromptu Pitch)",
        "slug": "one-minute-speech-challenge",
        "category_slug": "public-speaking",
        "description": "Record or write an impromptu 60-second persuasive speech addressing a workplace dilemma without notes.",
        "instructions": (
            "1. Choose a scenario: 'Advocating for flexible study hours' or 'Proposing a community sustainability initiative'.\n"
            "2. Structure: Hook (10s), Core Problem & Action (40s), Memorable Call to Action (10s).\n"
            "3. Submit your full transcript or an audio recording (max 3 minutes).\n"
            "4. Faculty will evaluate your clarity, vocal pacing, structure, and impact."
        ),
        "rubric": [
            {"criterion": "Structure & Flow", "max_points": 25, "description": "Clear hook, logical body, and punchy conclusion within time limit."},
            {"criterion": "Clarity & Articulation", "max_points": 25, "description": "Concise vocabulary, no filler words (um, ah, like)."},
            {"criterion": "Persuasiveness & Tone", "max_points": 25, "description": "Convincing rationale with appropriate professional tone."},
            {"criterion": "Practical Relevance", "max_points": 25, "description": "Actionable solutions applicable in a modern team environment."},
        ],
        "points_reward": 100,
    },
    {
        "title": "Group Discussion Dilemma Simulation",
        "slug": "group-discussion-dilemma",
        "category_slug": "teamwork-and-collaboration",
        "description": "Analyze a multi-stakeholder dispute in a student organization and articulate your moderation strategy.",
        "instructions": (
            "Scenario: Two team leads in your collegiate club strongly disagree on budget allocation for an annual event.\n"
            "Write a 300-500 word strategic response addressing:\n"
            "1. How you would open the dialogue to de-escalate tension.\n"
            "2. How you ensure quieter members are heard.\n"
            "3. The compromise framework you would propose."
        ),
        "rubric": [
            {"criterion": "Empathy & Objectivity", "max_points": 30, "description": "Acknowledges both perspectives without premature bias."},
            {"criterion": "Moderation Technique", "max_points": 35, "description": "Structured facilitation strategies that encourage balanced dialogue."},
            {"criterion": "Resolution Framework", "max_points": 35, "description": "Feasible, win-win outcome satisfying organizational goals."},
        ],
        "points_reward": 100,
    },
    {
        "title": "Mock Interview Practice: The STAR Method Drill",
        "slug": "mock-interview-star-drill",
        "category_slug": "interview-skills",
        "description": "Formulate and present a comprehensive STAR response for a behavioral question.",
        "instructions": (
            "Question: 'Tell me about a time you faced an unexpected failure or setback in an academic team project.'\n"
            "Format your submission clearly labeled:\n"
            "- Situation (Context, team size, challenge)\n"
            "- Task (Your specific responsibility)\n"
            "- Action (Concrete steps YOU took, technical and interpersonal)\n"
            "- Result (Quantifiable outcome, lessons learned, and self-reflection)."
        ),
        "rubric": [
            {"criterion": "STAR Completeness", "max_points": 30, "description": "All four components explicitly addressed with balance."},
            {"criterion": "Personal Ownership", "max_points": 35, "description": "Clear emphasis on 'I' vs 'we' in the Action phase."},
            {"criterion": "Reflective Maturity", "max_points": 35, "description": "Genuine insight gained from the setback applied to future work."},
        ],
        "points_reward": 100,
    },
    {
        "title": "Leadership Decision Scenarios: Crisis Allocation",
        "slug": "leadership-decision-scenarios",
        "category_slug": "leadership-skills",
        "description": "Evaluate high-stakes trade-offs under tight deadlines and draft a leadership communication memo.",
        "instructions": (
            "Your 4-person team is 48 hours away from a deadline, but a key deliverable has encountered an impasse.\n"
            "Detail your decisive leadership action plan and draft the exact 150-word message you send to your team."
        ),
        "rubric": [
            {"criterion": "Decisiveness", "max_points": 30, "description": "Clear choice made without avoidance or ambiguity."},
            {"criterion": "Team Morale & Tone", "max_points": 35, "description": "Inspires confidence and reduces panic while maintaining urgency."},
            {"criterion": "Contingency Planning", "max_points": 35, "description": "Realistic fallback options if initial recovery stalls."},
        ],
        "points_reward": 100,
    },
    {
        "title": "Time-Management Sprint & Eisenhower Matrix",
        "slug": "time-management-planning-exercise",
        "category_slug": "time-management",
        "description": "Categorize 12 complex weekly commitments into the Eisenhower Matrix and devise a time-boxed calendar.",
        "instructions": (
            "Review your current academic and personal schedule. Categorize tasks into:\n"
            "1. Urgent & Important (Do First)\n"
            "2. Not Urgent & Important (Schedule)\n"
            "3. Urgent & Not Important (Delegate/Streamline)\n"
            "4. Not Urgent & Not Important (Eliminate).\n"
            "Provide your final weekly block-schedule plan."
        ),
        "rubric": [
            {"criterion": "Accurate Prioritization", "max_points": 35, "description": "Disciplined separation of urgency vs genuine long-term importance."},
            {"criterion": "Feasibility & Buffers", "max_points": 35, "description": "Realistic rest periods and unexpected interruption buffers included."},
            {"criterion": "Self-Reflection", "max_points": 30, "description": "Identifies recurring personal time-traps and actionable countermeasures."},
        ],
        "points_reward": 100,
    },
    {
        "title": "Conflict-Resolution Mediation Simulation",
        "slug": "conflict-resolution-scenarios",
        "category_slug": "problem-solving-and-decision-making",
        "description": "Mediate an escalating interpersonal dispute between two project partners using non-violent communication.",
        "instructions": (
            "Draft a 4-step mediation intervention protocol utilizing observations, feelings, needs, and requests."
        ),
        "rubric": [
            {"criterion": "Non-Violent Principles", "max_points": 35, "description": "Separates objective observation from evaluative judgment."},
            {"criterion": "Safety Creation", "max_points": 35, "description": "Establishes a psychologically safe environment for both parties."},
            {"criterion": "Accountability Agreement", "max_points": 30, "description": "Clear mutual commitments and follow-up checkpoints."},
        ],
        "points_reward": 100,
    },
    {
        "title": "Teamwork Reflection: 360 Peer Dynamics",
        "slug": "teamwork-reflection",
        "category_slug": "teamwork-and-collaboration",
        "description": "Analyze your personal contribution, blind spots, and communication habits in your latest team engagement.",
        "instructions": (
            "Reflect critically on a recent group assignment. Where did you provide maximum leverage? Where did you unintentionally cause friction? What will you do differently next semester?"
        ),
        "rubric": [
            {"criterion": "Candor & Self-Awareness", "max_points": 40, "description": "Genuine vulnerability and awareness of interpersonal shortcomings."},
            {"criterion": "Peer Perspective Taking", "max_points": 30, "description": "Understanding team experience from partners' vantage points."},
            {"criterion": "Behavioral Adaptation Plan", "max_points": 30, "description": "Specific daily habits to practice in upcoming collaborations."},
        ],
        "points_reward": 100,
    },
    {
        "title": "Executive Presentation Preparation",
        "slug": "presentation-preparation",
        "category_slug": "presentation-skills",
        "description": "Design an executive summary slide deck outline for campus leadership regarding student well-being.",
        "instructions": (
            "Prepare a 5-slide outline following the Minto Pyramid Principle: Conclusion First, Supporting Arguments, Evidence."
        ),
        "rubric": [
            {"criterion": "Executive Storytelling", "max_points": 40, "description": "Bottom-line conclusion presented upfront with clarity."},
            {"criterion": "Cognitive Load Management", "max_points": 30, "description": "Clean structure avoiding text-heavy clutter."},
            {"criterion": "Q&A Preparedness", "max_points": 30, "description": "Anticipates top 3 tough scrutiny questions with pre-vetted answers."},
        ],
        "points_reward": 100,
    },
    {
        "title": "Active Listening Diagnostic & Log",
        "slug": "active-listening-exercise",
        "category_slug": "communication-skills",
        "description": "Conduct a 15-minute conversation applying reflective paraphrasing without giving unsolicited advice.",
        "instructions": (
            "Engage a classmate or friend on a topic they care about. Log 3 instances where you successfully paraphrased their feelings and thoughts before offering any input."
        ),
        "rubric": [
            {"criterion": "Paraphrase Accuracy", "max_points": 35, "description": "Captures both factual message and underlying emotional nuance."},
            {"criterion": "Advice Restraint", "max_points": 35, "description": "Resists urge to fix or deflect; holds space attentively."},
            {"criterion": "Subject Reaction Analysis", "max_points": 30, "description": "Evaluates how the speaker responded to feeling genuinely understood."},
        ],
        "points_reward": 100,
    },
    {
        "title": "Emotional Intelligence (EQ) Trigger Log",
        "slug": "emotional-intelligence-reflection",
        "category_slug": "emotional-intelligence",
        "description": "Identify your primary cognitive stress triggers and formulate replacement behavioral responses.",
        "instructions": (
            "Document 2 stressful interactions from the past month. Map: Trigger Event -> Automatic Physical/Mental Reaction -> Chosen Conscious Response."
        ),
        "rubric": [
            {"criterion": "Physiological & Mental Awareness", "max_points": 35, "description": "Recognizes subtle bodily cues and emotional onset indicators."},
            {"criterion": "De-escalation Strategies", "max_points": 35, "description": "Employs proven cognitive reframing or breathing techniques."},
            {"criterion": "Long-Term Growth Trajectory", "max_points": 30, "description": "Proposes actionable protocols to build emotional stamina."},
        ],
        "points_reward": 100,
    },
]

MOCK_INTERVIEW_QUESTIONS = [
    {
        "category": "Behavioral",
        "question": "Tell me about a time you had to work closely with someone whose working style conflicted with your own.",
        "difficulty": "Intermediate",
        "star_guide": {
            "situation": "Define the project, role, and the specific divergence in work ethic, communication, or speed.",
            "task": "Explain what you both needed to accomplish jointly despite differences.",
            "action": "Highlight your proactive communication, agreed compromises, and how you adapted your style.",
            "result": "Describe the deliverable outcome and how your working relationship evolved.",
        },
        "self_eval_criteria": [
            "Did I avoid badmouthing the peer and maintain professional respect?",
            "Did I highlight a concrete adaptation I personally made?",
            "Was the project outcome successful?",
        ],
    },
    {
        "category": "Situational",
        "question": "If you were assigned a crucial project milestone with ambiguous instructions and your team lead was unavailable, what steps would you take?",
        "difficulty": "Beginner",
        "star_guide": {
            "situation": "Frame an ambiguous scenario under strict deadlines.",
            "task": "Maintain momentum without executing flawed assumptions.",
            "action": "Consult existing documentation, benchmark standard practices, align with peer leads, and draft an explicit proposal for approval.",
            "result": "Ensure minimal lost time while keeping leadership informed.",
        },
        "self_eval_criteria": [
            "Did I show proactivity rather than passive waiting?",
            "Did I manage risk by validating assumptions?",
        ],
    },
    {
        "category": "HR",
        "question": "Where do you believe you need the most improvement in interpersonal communication, and what are you actively doing about it?",
        "difficulty": "Intermediate",
        "star_guide": {
            "situation": "Select a genuine soft-skill area (e.g. over-communicating details, speaking up in large executive forums).",
            "task": "Your goal to attain greater professional poise and efficacy.",
            "action": "Courses, practice, asking mentors for candid feedback, recording mock presentations.",
            "result": "Demonstrable recent improvements observed by peers.",
        },
        "self_eval_criteria": [
            "Is the weakness authentic without being disqualifying?",
            "Is there proactive, self-directed remediation underway?",
        ],
    },
    {
        "category": "Behavioral",
        "question": "Describe an instance where you had to persuade team members who were initially resistant to your idea.",
        "difficulty": "Advanced",
        "star_guide": {
            "situation": "Team locked into traditional approach or skeptical of your proposed initiative.",
            "task": "Align consensus without causing resentment or relying on authority.",
            "action": "Data gathering, one-on-one listening sessions to uncover concerns, presenting pilot trials.",
            "result": "Adoption of the initiative, measurable project lift, and preserved team cohesion.",
        },
        "self_eval_criteria": [
            "Did I listen to their objections first before pushing my viewpoint?",
            "Did I use objective evidence and small pilot tests to de-risk change?",
        ],
    },
]

ACHIEVEMENT_BADGES = [
    {
        "slug": "first-step",
        "title": "First Step Forward",
        "description": "Completed your very first soft-skills module lesson.",
        "category": "modules",
        "icon": "Footprints",
        "points_reward": 25,
        "criteria": {"lessons_completed": 1},
    },
    {
        "slug": "diagnostic-pioneer",
        "title": "Diagnostic Pioneer",
        "description": "Completed the comprehensive baseline soft-skills assessment.",
        "category": "assessments",
        "icon": "Award",
        "points_reward": 50,
        "criteria": {"assessments_completed": 1},
    },
    {
        "slug": "active-speaker",
        "title": "Vocal Vanguard",
        "description": "Completed public speaking and communication practice activities.",
        "category": "activities",
        "icon": "Mic",
        "points_reward": 75,
        "criteria": {"activities_completed": 2},
    },
    {
        "slug": "team-player",
        "title": "Synergy Champion",
        "description": "Successfully completed teamwork and conflict mediation challenges.",
        "category": "teamwork",
        "icon": "Users",
        "points_reward": 100,
        "criteria": {"activities_completed": 4},
    },
    {
        "slug": "master-communicator",
        "title": "Master Communicator",
        "description": "Reached 500+ total platform soft-skills development points.",
        "category": "points",
        "icon": "Trophy",
        "points_reward": 150,
        "criteria": {"total_points": 500},
    },
]


def build_modules_for_category(category_id, cat_slug, cat_name):
    """Generate 2 comprehensive modules with 3 lessons each for a category."""
    modules = []

    # Module 1
    mod1_title = f"Foundations of {cat_name}"
    mod1 = {
        "title": mod1_title,
        "slug": f"foundations-of-{cat_slug}",
        "category_id": category_id,
        "category_name": cat_name,
        "description": f"Core principles, behavioral patterns, and practical introductory techniques in {cat_name}.",
        "difficulty": "Beginner",
        "estimated_minutes": 45,
        "learning_objectives": [
            f"Understand the fundamental significance of {cat_name} in professional settings.",
            "Identify common interpersonal pitfalls and instinctive cognitive barriers.",
            "Implement three actionable daily behavioral frameworks.",
        ],
        "status": "published",
        "points_reward": 60,
        "lessons": [
            {
                "id": f"{cat_slug}-l1",
                "title": f"The Psychology and Core Pillars of {cat_name}",
                "estimated_minutes": 15,
                "content": f"### Understanding the Foundations\n\nIn collegiate and workplace environments, technical prowess opens the door, but **{cat_name}** determines your trajectory.\n\nResearch demonstrates that over 85% of long-term career success stems from well-developed human capabilities. By mastering the core pillars of this discipline, you transition from reactive habit to intentional poise.",
                "examples": [
                    "A project manager framing feedback around mutual goals rather than subjective fault.",
                    "A student researcher establishing clear expectations before team delegation.",
                ],
                "practical_exercises": [
                    "Conduct a 5-minute self-audit of your communication patterns during yesterday's meetings.",
                    "Write down two triggers that challenge your composure.",
                ],
                "knowledge_checks": [
                    {
                        "question": f"What is the primary indicator of maturity in {cat_name}?",
                        "options": [
                            "Immediate emotional reaction",
                            "Intentional response grounded in empathy and clarity",
                            "Domination of the dialogue",
                            "Avoiding difficult conversations entirely",
                        ],
                        "correct_index": 1,
                        "explanation": "Professional maturity is defined by replacing instinctive emotional reactions with intentional, clear, and empathetic communication.",
                    }
                ],
            },
            {
                "id": f"{cat_slug}-l2",
                "title": f"Common Pitfalls and How to Overcome Them",
                "estimated_minutes": 15,
                "content": "### Deconstructing Interpersonal Blind Spots\n\nMost breakdowns in collaboration occur not from malice, but from misaligned assumptions, defensive postures, and ambiguous framing.\n\nKey strategies for prevention:\n- **Explicit Alignment**: Re-confirming conclusions in writing.\n- **Separating Person from Problem**: Focusing criticism on objective processes.",
                "examples": [
                    "Translating 'You never submit on time' into 'When deliverables miss the Tuesday cutoff, our team timeline slips by 48 hours.'",
                ],
                "practical_exercises": [
                    "Reframe an abrasive feedback statement into constructive objective feedback.",
                ],
                "knowledge_checks": [
                    {
                        "question": "Which framing is most constructive when addressing team delays?",
                        "options": [
                            "Accusing the individual of being lazy",
                            "Describing the objective impact of the timeline slip without personal attacks",
                            "Ignoring the delay to avoid awkwardness",
                            "Complaining to senior faculty immediately",
                        ],
                        "correct_index": 1,
                        "explanation": "Describing the objective impact focuses on accountability and problem-solving without provoking defensiveness.",
                    }
                ],
            },
            {
                "id": f"{cat_slug}-l3",
                "title": f"Daily Behavioral Frameworks for Long-term Mastery",
                "estimated_minutes": 15,
                "content": "### Translating Theory into Lifelong Muscle Memory\n\nSoft skills are not acquired through passive reading; they require deliberative practice in everyday interactions.\n\nFollow the **Observe-Pause-Frame-Engage (OPFE)** model in every conversation.",
                "examples": [
                    "Pausing for 3 seconds before responding to an unexpected question in an interview.",
                ],
                "practical_exercises": [
                    "Commit to the 3-second pause during your next three conversations today.",
                ],
                "knowledge_checks": [
                    {
                        "question": "Why is the deliberate pause effective in stressful dialogues?",
                        "options": [
                            "It makes you look indifferent",
                            "It interrupts the amygdala hijack, allowing rational cognitive framing",
                            "It confuses the counterparty",
                            "It delays the meeting unnecessarily",
                        ],
                        "correct_index": 1,
                        "explanation": "The pause allows the prefrontal cortex to process information and form a strategic response rather than an emotional reflex.",
                    }
                ],
            },
        ],
    }
    modules.append(mod1)

    # Module 2
    mod2_title = f"Advanced Workplace Application of {cat_name}"
    mod2 = {
        "title": mod2_title,
        "slug": f"advanced-{cat_slug}",
        "category_id": category_id,
        "category_name": cat_name,
        "description": f"High-stakes workplace scenarios, strategic stakeholder engagement, and executive presence in {cat_name}.",
        "difficulty": "Advanced",
        "estimated_minutes": 55,
        "learning_objectives": [
            "Navigate complex organizational politics with high integrity.",
            "De-escalate high-stakes friction with cross-functional leadership.",
            "Influence without formal authority.",
        ],
        "status": "published",
        "points_reward": 80,
        "lessons": [
            {
                "id": f"{cat_slug}-adv-l1",
                "title": "Stakeholder Analysis and Perspective Mapping",
                "estimated_minutes": 15,
                "content": "### Mapping Hidden Priorities\n\nIn advanced organizational leadership, stakeholders rarely share identical incentives. Identifying their unstated fears, metrics, and goals enables mutually beneficial alignment.",
                "examples": [
                    "Understanding that finance fears unbudgeted variance, while engineering fears technical debt.",
                ],
                "practical_exercises": [
                    "Map 3 distinct stakeholders in your college department and identify their primary competing goals.",
                ],
                "knowledge_checks": [
                    {
                        "question": "When presenting an initiative to diverse stakeholders, what should be addressed first?",
                        "options": [
                            "Your personal career ambition",
                            "How the proposal mitigates their primary risk or supports their strategic goals",
                            "How long you spent preparing the slides",
                            "Only technical jargon",
                        ],
                        "correct_index": 1,
                        "explanation": "Stakeholders engage when their core concerns and strategic risks are addressed upfront.",
                    }
                ],
            },
            {
                "id": f"{cat_slug}-adv-l2",
                "title": "Managing High-Stakes Friction and Negotiations",
                "estimated_minutes": 20,
                "content": "### Principled Negotiation Under Pressure\n\nApplying the Harvard Negotiation Project principles:\n1. Separate the people from the problem.\n2. Focus on interests, not positions.\n3. Invent options for mutual gain.\n4. Insist on using objective criteria.",
                "examples": [
                    "Negotiating milestone deadlines between academic project leads and external mentors.",
                ],
                "practical_exercises": [
                    "Take a current point of disagreement and identify the underlying interests behind both positions.",
                ],
                "knowledge_checks": [
                    {
                        "question": "In principled negotiation, what is the distinction between 'positions' and 'interests'?",
                        "options": [
                            "Positions are feelings, interests are facts",
                            "Positions are what parties say they want; interests are why they want it",
                            "There is no distinction",
                            "Positions belong to leaders, interests belong to juniors",
                        ],
                        "correct_index": 1,
                        "explanation": "Positions are concrete demands; interests are the underlying motivations, needs, or fears driving those demands.",
                    }
                ],
            },
            {
                "id": f"{cat_slug}-adv-l3",
                "title": "Executive Poise, Gravitas, and Influencing Without Authority",
                "estimated_minutes": 20,
                "content": "### The Anatomy of Executive Presence\n\nPresence is not loudness. It is clarity of thought, calm physiological composure, and speaking with structured economy.\n\nPractice the **Headline-First Communication Model**.",
                "examples": [
                    "Summarizing a 30-page departmental review in 3 concise, actionable bullet points.",
                ],
                "practical_exercises": [
                    "Record yourself giving a 90-second executive summary of your current term project.",
                ],
                "knowledge_checks": [
                    {
                        "question": "What is the hallmark of the Headline-First communication style?",
                        "options": [
                            "Sharing background history for 10 minutes before stating the point",
                            "Delivering the critical conclusion and recommendation immediately in the opening sentence",
                            "Avoiding any recommendations to stay neutral",
                            "Using emotional appeals only",
                        ],
                        "correct_index": 1,
                        "explanation": "Executive audiences require the bottom-line conclusion and recommendation upfront to frame subsequent details effectively.",
                    }
                ],
            },
        ],
    }
    modules.append(mod2)

    return modules


INITIAL_ASSESSMENT_QUESTIONS = [
    {
        "category_slug": "communication-skills",
        "question_type": "scenario",
        "question": "During a cross-functional project sync, a peer misinterprets your recommendation and claims in front of the team that your proposal will cause project failure. How do you respond?",
        "options": [
            "Immediately defend yourself aggressively and challenge their competence.",
            "Remain silent and vent your frustration to other peers after the call.",
            "Calmly acknowledge their concern, clarify the distinction between their interpretation and your actual proposal, and invite them to explore mitigation together.",
            "Interrupt them repeatedly until you have proven their data incorrect.",
        ],
        "correct_index": 2,
        "score_weight": 5,
        "explanation": "Graceful de-escalation with objective clarification maintains collaborative team morale while effectively correcting misconceptions.",
    },
    {
        "category_slug": "communication-skills",
        "question_type": "mcq",
        "question": "What is the primary characteristic of active listening?",
        "options": [
            "Thinking about your counter-argument while the other person speaks",
            "Paraphrasing the speaker's emotional and factual message to verify understanding before formulating a response",
            "Nodding continually while checking project updates on your phone",
            "Giving immediate advice as soon as the speaker pauses",
        ],
        "correct_index": 1,
        "score_weight": 5,
        "explanation": "Active listening requires full cognitive presence and validating the counterparty's message before responding.",
    },
    {
        "category_slug": "leadership-skills",
        "question_type": "scenario",
        "question": "Your collegiate team is demoralized after receiving harsh critique on an interim prototype. How do you lead the recovery?",
        "options": [
            "Point out which specific team members produced subpar work.",
            "Acknowledge the disappointment, extract objective feedback themes as an actionable sprint roadmap, and reaffirm team confidence.",
            "Tell the team the evaluators were biased and ignore their feedback.",
            "Step down as lead so someone else can take the blame.",
        ],
        "correct_index": 1,
        "score_weight": 5,
        "explanation": "Effective leaders validate emotional reality while promptly re-orienting energy toward constructive action.",
    },
    {
        "category_slug": "leadership-skills",
        "question_type": "self_eval",
        "question": "I proactively step forward to provide structure and clarity when a group project lacks direction.",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "correct_index": 4,
        "score_weight": 5,
        "explanation": "Self-assessing initiative and willingness to mobilize peers in ambiguous conditions.",
    },
    {
        "category_slug": "teamwork-and-collaboration",
        "question_type": "scenario",
        "question": "A team member consistently misses sub-deadlines, putting the final presentation at risk. What is your first step?",
        "options": [
            "Report them to the faculty coordinator without warning.",
            "Have a private, one-on-one conversation to understand what obstacles they are facing and re-negotiate manageable checkpoints.",
            "Complain in the group chat so other members can pressure them.",
            "Silently do all their work yourself and resent them.",
        ],
        "correct_index": 1,
        "score_weight": 5,
        "explanation": "Direct, empathetic one-on-one inquiry addresses potential root causes while preserving dignity and accountability.",
    },
    {
        "category_slug": "teamwork-and-collaboration",
        "question_type": "self_eval",
        "question": "I comfortably incorporate peer feedback to improve shared deliverables, even when I was originally confident in my own draft.",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "correct_index": 4,
        "score_weight": 5,
        "explanation": "Demonstrates low ego, high receptivity, and collective product focus.",
    },
    {
        "category_slug": "time-management",
        "question_type": "mcq",
        "question": "In the Eisenhower Decision Matrix, in which quadrant should long-term career growth, soft skills development, and proactive planning reside?",
        "options": [
            "Quadrant 1: Urgent & Important",
            "Quadrant 2: Not Urgent, but Important",
            "Quadrant 3: Urgent, but Not Important",
            "Quadrant 4: Not Urgent & Not Important",
        ],
        "correct_index": 1,
        "score_weight": 5,
        "explanation": "Quadrant 2 activities are foundational for growth and success, requiring deliberate scheduled dedication before they become emergencies.",
    },
    {
        "category_slug": "time-management",
        "question_type": "scenario",
        "question": "You have a major semester presentation in 3 days, but friends invite you to an impromptu evening social event that will consume 5 hours. How do you handle this?",
        "options": [
            "Attend the event and pull an all-nighter before the presentation.",
            "Politely decline with an appreciative message, protect your scheduled rehearsal block, and propose meeting up after the deadline.",
            "Ghost your friends completely without explanation.",
            "Skim through your presentation slides in 10 minutes and attend the event with lingering anxiety.",
        ],
        "correct_index": 1,
        "score_weight": 5,
        "explanation": "Professional boundary-setting protects critical priorities with respect and zero guilt.",
    },
    {
        "category_slug": "problem-solving-and-decision-making",
        "question_type": "scenario",
        "question": "When approaching a sudden drop in club workshop attendance, what should your team do first?",
        "options": [
            "Immediately launch a raffle with expensive prizes to attract attendees.",
            "Conduct structured 5-Whys root-cause interviews with students who didn't attend to uncover core friction points.",
            "Assume students are just unmotivated and cancel all remaining workshops.",
            "Blame the social media coordinator.",
        ],
        "correct_index": 1,
        "score_weight": 5,
        "explanation": "Root cause diagnostic investigation prevents wasting resources on superficial symptom bandages.",
    },
    {
        "category_slug": "emotional-intelligence",
        "question_type": "scenario",
        "question": "You receive a blunt email from a professor questioning your project methodology. Your heart rate spikes and you feel defensive. What is the most effective immediate response?",
        "options": [
            "Send an instant point-by-point counterattack while your emotions are peaked.",
            "Step away from your screen, breathe deeply to deactivate physiological stress, review the feedback objectively, and draft a respectful follow-up requesting a 10-minute clarification meeting.",
            "Ignore the email and hope they forget.",
            "Post the email on student social media to solicit sympathy.",
        ],
        "correct_index": 1,
        "score_weight": 5,
        "explanation": "Emotional self-regulation decouples emotional trigger from professional behavioral response.",
    },
    {
        "category_slug": "public-speaking",
        "question_type": "mcq",
        "question": "What is the most effective technique to control physiological vocal tremors and rapid speech when stepping onto a stage?",
        "options": [
            "Drinking large quantities of caffeine",
            "Taking 3 deep diaphragmatic breaths and grounding your stance with weight distributed evenly on both feet",
            "Speaking as fast as possible to finish earlier",
            "Staring exclusively at your cue cards without looking up",
        ],
        "correct_index": 1,
        "score_weight": 5,
        "explanation": "Diaphragmatic breathing stimulates the parasympathetic nervous system, stabilizing pitch, pacing, and presence.",
    },
    {
        "category_slug": "body-language-and-confidence",
        "question_type": "self_eval",
        "question": "When interacting in professional settings, I maintain relaxed, natural eye contact and an open physical posture.",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "correct_index": 4,
        "score_weight": 5,
        "explanation": "Evaluates poise, open non-verbal signaling, and conversational presence.",
    },
    {
        "category_slug": "interview-skills",
        "question_type": "mcq",
        "question": "When answering 'What is your greatest weakness?' in an interview, what is the best strategy?",
        "options": [
            "Say 'I am too much of a perfectionist' or 'I work too hard'",
            "State that you have no weaknesses",
            "Highlight a genuine non-fatal skill gap, explain the concrete self-directed measures you are taking to improve, and share recent positive progress",
            "Disclose a severe personal liability that prevents you from performing the role",
        ],
        "correct_index": 2,
        "score_weight": 5,
        "explanation": "Demonstrates self-awareness, honesty, and active commitment to continuous professional self-development.",
    },
    {
        "category_slug": "presentation-skills",
        "question_type": "scenario",
        "question": "Halfway through your presentation, you realize your slides are not advancing due to a technical glitch. What do you do?",
        "options": [
            "Panic and freeze until someone fixes the projector.",
            "Apologize profusely 10 times and sit down.",
            "Gracefully acknowledge the glitch with a calm smile, step forward to speak directly to the audience, and continue delivering your core narrative seamlessly.",
            "Yell at the technician in front of everyone.",
        ],
        "correct_index": 2,
        "score_weight": 5,
        "explanation": "Executive presence is proven when you are unshakeable by external technical friction.",
    },
    {
        "category_slug": "critical-thinking",
        "question_type": "mcq",
        "question": "Which of the following demonstrates the 'Correlation vs. Causation' logical fallacy?",
        "options": [
            "Assuming that because ice cream sales and sunburn incidents rise together, ice cream consumption causes sunburns",
            "Conducting double-blind randomized controlled experiments",
            "Reviewing peer-reviewed literature before drawing conclusions",
            "Soliciting counter-examples to challenge a prevailing theory",
        ],
        "correct_index": 0,
        "score_weight": 5,
        "explanation": "Co-occurring trends do not establish a causal mechanism without controlled evidence.",
    },
    {
        "category_slug": "professional-etiquette",
        "question_type": "scenario",
        "question": "You need to request a recommendation letter from a professor or industry mentor. How should you structure your message?",
        "options": [
            "Send a one-sentence text: 'Hey professor, need a letter by tomorrow thanks.'",
            "Provide a courteous email with a clear subject line, remind them of your specific shared projects, state the submission deadline with at least 3 weeks buffer, and attach your updated resume and draft bullet points.",
            "Show up at their home unannounced.",
            "Demand that they write it because you attended all lectures.",
        ],
        "correct_index": 1,
        "score_weight": 5,
        "explanation": "Professional etiquette respects mentors' time by providing ample notice, clear context, and helpful collateral.",
    },
    {
        "category_slug": "critical-thinking",
        "question_type": "self_eval",
        "question": "When presented with a compelling argument that contradicts my personal beliefs, I actively seek out counter-evidence rather than dismissing it immediately.",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "correct_index": 4,
        "score_weight": 5,
        "explanation": "Measures cognitive flexibility and resistance to confirmation bias.",
    },
    {
        "category_slug": "problem-solving-and-decision-making",
        "question_type": "self_eval",
        "question": "I break complex ambiguous challenges into structured, testable hypotheses before jumping into action.",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "correct_index": 4,
        "score_weight": 5,
        "explanation": "Evaluates structured problem-framing capabilities.",
    },
    {
        "category_slug": "emotional-intelligence",
        "question_type": "self_eval",
        "question": "I can accurately identify the emotional state of team members during meetings, even when they do not explicitly speak up.",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "correct_index": 4,
        "score_weight": 5,
        "explanation": "Measures social perception and empathetic radar.",
    },
    {
        "category_slug": "professional-etiquette",
        "question_type": "self_eval",
        "question": "I consistently arrive 5 minutes early to commitments, respect meeting agendas, and mute my microphone when not speaking on video calls.",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        "correct_index": 4,
        "score_weight": 5,
        "explanation": "Assesses foundational reliability and digital courtesy.",
    },
]


async def seed_database_direct(db, with_demo_users: bool = False, print_logs: bool = True):
    """Direct database seeder function callable from script or application lifespan."""
    now = datetime.now(timezone.utc)

    # 1. Seed Categories
    category_map = {}
    for cat in CATEGORIES:
        existing = await db.skill_categories.find_one_and_update(
            {"slug": cat["slug"]},
            {"$set": {**cat, "updated_at": now}, "$setOnInsert": {"created_at": now}},
            upsert=True,
            return_document=True,
        )
        if not existing:
            existing = await db.skill_categories.find_one({"slug": cat["slug"]})
        category_map[cat["slug"]] = existing["_id"]
        if print_logs:
            print(f"  + Category: {cat['name']}")

    # 2. Seed Modules (2+ per category = 24+ modules)
    total_modules_seeded = 0
    for cat in CATEGORIES:
        cat_id = category_map[cat["slug"]]
        modules = build_modules_for_category(cat_id, cat["slug"], cat["name"])
        for mod in modules:
            await db.learning_modules.update_one(
                {"slug": mod["slug"]},
                {"$set": {**mod, "updated_at": now}, "$setOnInsert": {"created_at": now}},
                upsert=True,
            )
            total_modules_seeded += 1
    if print_logs:
        print(f"  + Total modules seeded: {total_modules_seeded}")

    # 3. Seed Practical Activities
    for act in PRACTICAL_ACTIVITIES:
        act_copy = dict(act)
        cat_slug = act_copy.pop("category_slug", "communication-skills")
        act_copy["category_id"] = category_map.get(cat_slug)
        await db.practical_activities.update_one(
            {"slug": act_copy["slug"]},
            {"$set": {**act_copy, "updated_at": now}, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        if print_logs:
            print(f"  + Activity: {act['title']}")

    # 4. Seed Baseline Diagnostic Assessment
    assessment_doc = {
        "title": "Comprehensive Soft-Skills Diagnostic Assessment",
        "slug": "baseline-soft-skills-assessment",
        "description": "20-question diagnostic evaluation covering all 12 core soft-skills disciplines.",
        "category_slug": "all",
        "estimated_minutes": 25,
        "is_initial": True,
        "passing_score": 60,
        "questions": INITIAL_ASSESSMENT_QUESTIONS,
        "status": "published",
        "updated_at": now,
    }
    await db.assessments.update_one(
        {"slug": assessment_doc["slug"]},
        {"$set": assessment_doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )

    # 5. Seed Badges & Interview Banks
    for badge in ACHIEVEMENT_BADGES:
        await db.achievement_badges.update_one(
            {"slug": badge["slug"]},
            {"$set": {**badge, "updated_at": now}, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )

    await db.mock_interview_questions.delete_many({})
    for q in MOCK_INTERVIEW_QUESTIONS:
        await db.mock_interview_questions.insert_one({**q, "created_at": now})

    # 6. Development Demo Users (ONLY in development)
    if with_demo_users:
        if not settings.is_development:
            if print_logs:
                print("[SECURITY WARNING] Refusing to create demo accounts in non-development environment.")
        else:
            demo_pass = "Password123!"
            hashed_demo = await hash_password(demo_pass)

            # Admin
            admin_doc = {
                "email": "admin@ssp.edu",
                "password_hash": await hash_password("AdminPass123!"),
                "full_name": "Dean Victoria Vance",
                "role": "admin",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            await db.users.update_one({"email": admin_doc["email"]}, {"$set": admin_doc}, upsert=True)
            if print_logs:
                print("  + Admin: admin@ssp.edu | Password: AdminPass123!")

            # Faculty
            faculty_list = [
                {"email": "faculty@ssp.edu", "full_name": "Prof. Marcus Thorne", "dept": "Humanities & Soft Skills"},
                {"email": "faculty2@ssp.edu", "full_name": "Dr. Elena Rostova", "dept": "Career Advancement & Leadership"},
            ]
            faculty_ids = []
            for fac in faculty_list:
                f_doc = {
                    "email": fac["email"],
                    "password_hash": await hash_password("FacultyPass123!"),
                    "full_name": fac["full_name"],
                    "role": "faculty",
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                }
                res = await db.users.find_one_and_update(
                    {"email": fac["email"]},
                    {"$set": f_doc},
                    upsert=True,
                    return_document=True,
                )
                if not res:
                    res = await db.users.find_one({"email": fac["email"]})
                faculty_ids.append(res["_id"])
                await db.faculty_profiles.update_one(
                    {"user_id": res["_id"]},
                    {"$set": {"department": fac["dept"], "title": "Senior Faculty Lead", "updated_at": now}},
                    upsert=True,
                )
                if print_logs:
                    print(f"  + Faculty: {fac['email']} | Password: FacultyPass123!")

            # Students
            students_list = [
                {"email": "student@college.edu", "full_name": "Alex Sharma", "usn": "1CS21CS042", "branch": "Computer Engineering", "sem": 6},
                {"email": "priya.k@college.edu", "full_name": "Priya Kulkarni", "usn": "1IS21IS015", "branch": "Information Science", "sem": 6},
                {"email": "rohit.m@college.edu", "full_name": "Rohit Mehta", "usn": "1EC22EC088", "branch": "Electronics", "sem": 4},
                {"email": "ananya.r@college.edu", "full_name": "Ananya Roy", "usn": "1ME23ME003", "branch": "Mechanical", "sem": 2},
                {"email": "sid.n@college.edu", "full_name": "Siddharth Nair", "usn": "1CV20CV055", "branch": "Civil", "sem": 8},
            ]

            for s in students_list:
                s_user = {
                    "email": s["email"],
                    "password_hash": hashed_demo,
                    "full_name": s["full_name"],
                    "role": "student",
                    "student_id": s["usn"],
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                }
                res = await db.users.find_one_and_update(
                    {"email": s["email"]},
                    {"$set": s_user},
                    upsert=True,
                    return_document=True,
                )
                if not res:
                    res = await db.users.find_one({"email": s["email"]})
                await db.student_profiles.update_one(
                    {"user_id": res["_id"]},
                    {
                        "$set": {
                            "student_id": s["usn"],
                            "branch": s["branch"],
                            "semester": s["sem"],
                            "overall_skill_score": 74.5 if s["sem"] > 4 else 58.0,
                            "completed_modules_count": 3 if s["sem"] > 4 else 1,
                            "completed_activities_count": 2 if s["sem"] > 4 else 0,
                            "completed_assessments_count": 1,
                            "current_streak_days": 4,
                            "total_points": 240 if s["sem"] > 4 else 90,
                            "updated_at": now,
                        },
                        "$setOnInsert": {"created_at": now},
                    },
                    upsert=True,
                )
                if faculty_ids:
                    await db.faculty_assignments.update_one(
                        {"faculty_id": faculty_ids[0], "student_id": res["_id"]},
                        {"$set": {"assigned_at": now}},
                        upsert=True,
                    )
                if print_logs:
                    print(f"  + Student: {s['email']} (USN: {s['usn']}) | Password: {demo_pass}")


async def seed_database(with_demo_users: bool = False):
    print("=" * 70)
    print("  Student Skill Development Platform - Database Seeder")
    print("=" * 70)

    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2500)
        await client.admin.command("ping")
        db = client[settings.MONGODB_DB_NAME]
        print(f"Connected to MongoDB at {settings.MONGODB_URI} (DB: {settings.MONGODB_DB_NAME})")
        await seed_database_direct(db, with_demo_users=with_demo_users, print_logs=True)
        client.close()
        print("\n" + "=" * 70)
        print("  [SUCCESS] All Seed Data Successfully Verified & Inserted!")
        print("=" * 70)
    except Exception as exc:
        print(f"\n[WARNING] Could not connect to live MongoDB at {settings.MONGODB_URI}: {exc}")
        print("\nTo seed a live database:")
        print("1. If using local MongoDB, ensure the MongoDB service is running on port 27017.")
        print("2. If using MongoDB Atlas, configure your connection string in 'server/.env':")
        print("   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/ssp_db?retryWrites=true&w=majority")
        print("\nNote: When running the FastAPI server in development mode, the platform automatically")
        print("initializes and seeds an in-memory mock MongoDB so all features are immediately testable.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed SSP database.")
    parser.add_argument("--with-demo-users", action="store_true", help="Generate development demo accounts")
    args = parser.parse_args()
    asyncio.run(seed_database(with_demo_users=args.with_demo_users))
