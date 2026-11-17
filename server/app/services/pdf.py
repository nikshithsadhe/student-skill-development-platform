"""
ReportLab PDF Progress Report Generation Service.
Runs synchronously inside a worker thread via asyncio.to_thread to avoid blocking the event loop.
"""
from datetime import datetime, timezone
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_pdf_report_sync(data: dict) -> bytes:
    """Generate professional PDF progress report document in-memory."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    primary_color = colors.HexColor("#7C3AED")
    dark_navy = colors.HexColor("#0B1020")
    surface_color = colors.HexColor("#121933")
    text_muted = colors.HexColor("#6B7280")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=text_muted,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=dark_navy,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.black,
    )

    # Header
    story.append(Paragraph("Student Skill Development Platform (SSP)", title_style))
    story.append(Paragraph("Official Collegiate Soft-Skills Comprehensive Progress Report", subtitle_style))
    story.append(Paragraph(f"Generated Date: {datetime.now(timezone.utc).strftime('%B %d, %Y - %H:%M UTC')}", subtitle_style))
    story.append(Spacer(1, 15))

    # Student Info Table
    student = data.get("student", {})
    profile = data.get("profile", {})
    info_data = [
        [
            Paragraph(f"<b>Student Name:</b> {student.get('full_name', 'N/A')}", body_style),
            Paragraph(f"<b>USN / Student ID:</b> {student.get('student_id', 'N/A')}", body_style),
        ],
        [
            Paragraph(f"<b>Academic Branch:</b> {profile.get('branch', 'N/A')}", body_style),
            Paragraph(f"<b>Current Semester:</b> Semester {profile.get('semester', 'N/A')}", body_style),
        ],
        [
            Paragraph(f"<b>Overall Soft-Skill Score:</b> {profile.get('overall_skill_score', 0.0)}%", body_style),
            Paragraph(f"<b>Total Development Points:</b> {profile.get('total_points', 0)} pts", body_style),
        ],
    ]
    info_table = Table(info_data, colWidths=[260, 260])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F3F4F6")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 15))

    # Diagnostic Assessment Summary
    story.append(Paragraph("1. Diagnostic Assessment Breakdown", section_heading))
    latest_attempt = data.get("latest_attempt")
    if latest_attempt:
        skill_scores = latest_attempt.get("skill_wise_scores", {})
        score_rows = [["Soft-Skills Discipline", "Score (%)", "Evaluation Status"]]
        for skill, score in skill_scores.items():
            status = "Proficient" if score >= 75 else "Growth Target" if score < 70 else "Developing"
            score_rows.append([
                skill.replace("-", " ").title(),
                f"{score}%",
                status,
            ])

        score_table = Table(score_rows, colWidths=[260, 100, 160])
        score_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), primary_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ]))
        story.append(score_table)
    else:
        story.append(Paragraph("<i>Diagnostic Assessment: Not yet assessed.</i>", body_style))
    story.append(Spacer(1, 15))

    # Completed Learning Modules
    story.append(Paragraph("2. Completed Learning Tracks & Modules", section_heading))
    completed_modules = data.get("completed_modules", [])
    if completed_modules:
        mod_rows = [["Module Title", "Discipline", "Completion Date"]]
        for mod in completed_modules:
            c_date = mod.get("completed_at", "Completed")
            if isinstance(c_date, datetime):
                c_date = c_date.strftime("%Y-%m-%d")
            mod_rows.append([
                mod.get("title", ""),
                mod.get("category_name", ""),
                str(c_date),
            ])
        mod_table = Table(mod_rows, colWidths=[260, 160, 100])
        mod_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4B5563")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ]))
        story.append(mod_table)
    else:
        story.append(Paragraph("<i>No modules fully completed yet.</i>", body_style))
    story.append(Spacer(1, 15))

    # Footer note
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "<i>Notice: This report reflects structured educational soft-skills performance in assessments and collegiate "
        "learning modules. It does not constitute a clinical personality diagnosis.</i>",
        subtitle_style,
    ))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
