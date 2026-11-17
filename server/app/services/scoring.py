"""
Transparent Scoring Service for Soft-Skills Assessments.

Documented Scoring Formula:
1. Multiple Choice & Scenario Questions:
   - Correct answer: 100% of question weight (default: 5.0 points)
   - Incorrect answer: 0.0 points
2. Self-Evaluation (5-point Likert Scale: Strongly Disagree to Strongly Agree):
   - Proportional scale: points = (selected_option_index / 4.0) * question_weight
3. Category Percentage:
   - (Total earned points in Category / Total max points in Category) * 100
4. Overall Soft-Skills Score:
   - (Total earned points across all questions / Total max points) * 100
5. Strengths: Categories scoring >= 75%
6. Growth / Improvement Areas: Categories scoring < 70%
"""
from typing import Any


def calculate_assessment_results(questions: list[dict], answers: list[dict]) -> dict[str, Any]:
    """
    Calculate transparent, reproducible soft-skill diagnostic score.
    Returns:
    - total_score (0.0 to 100.0)
    - skill_wise_scores (dict mapping category_slug to percentage)
    - strengths (list of top performing category names)
    - improvement_areas (list of growth categories)
    - detailed_breakdown (per-question answer analysis)
    """
    answers_map = {a.get("question_index"): a.get("selected_option") for a in answers}

    total_earned = 0.0
    total_max = 0.0

    cat_earned: dict[str, float] = {}
    cat_max: dict[str, float] = {}
    detailed_breakdown = []

    for idx, q in enumerate(questions):
        weight = float(q.get("score_weight", 5))
        cat_slug = q.get("category_slug", "general")
        q_type = q.get("question_type", "mcq")
        correct_idx = q.get("correct_index", 0)

        selected_idx = answers_map.get(idx)
        earned = 0.0
        is_correct = False

        if selected_idx is not None:
            if q_type == "self_eval":
                # 5-point Likert scale (0 to 4)
                ratio = min(max(float(selected_idx) / 4.0, 0.0), 1.0)
                earned = ratio * weight
                is_correct = ratio >= 0.75
            else:
                # MCQ or scenario
                if selected_idx == correct_idx:
                    earned = weight
                    is_correct = True
                else:
                    earned = 0.0
                    is_correct = False

        total_earned += earned
        total_max += weight

        cat_earned[cat_slug] = cat_earned.get(cat_slug, 0.0) + earned
        cat_max[cat_slug] = cat_max.get(cat_slug, 0.0) + weight

        detailed_breakdown.append({
            "question_index": idx,
            "category_slug": cat_slug,
            "question_text": q.get("question", ""),
            "selected_option": selected_idx,
            "correct_option": correct_idx,
            "is_correct": is_correct,
            "points_earned": round(earned, 2),
            "max_points": weight,
            "explanation": q.get("explanation", ""),
        })

    # Calculate overall score
    overall_score = round((total_earned / max(1.0, total_max)) * 100.0, 1)

    # Calculate category percentages
    skill_wise_scores = {}
    strengths = []
    improvement_areas = []

    for cat_slug, max_pts in cat_max.items():
        earned_pts = cat_earned.get(cat_slug, 0.0)
        pct = round((earned_pts / max(1.0, max_pts)) * 100.0, 1)
        skill_wise_scores[cat_slug] = pct

        if pct >= 75.0:
            strengths.append(cat_slug)
        elif pct < 70.0:
            improvement_areas.append(cat_slug)

    return {
        "overall_score": overall_score,
        "total_earned": round(total_earned, 2),
        "total_max": round(total_max, 2),
        "skill_wise_scores": skill_wise_scores,
        "strengths": strengths,
        "improvement_areas": improvement_areas,
        "detailed_breakdown": detailed_breakdown,
        "formula_documentation": (
            "Score = (Total Points Earned / Total Maximum Points) × 100. "
            "Scenario & MCQ questions award full points on correct choices. "
            "Self-evaluation Likert scale questions award points proportionally (0-100%)."
        ),
    }
