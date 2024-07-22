from flask import current_app
from flask_jwt_extended import current_user
from sqlalchemy.future import select

from models import Agreement, Document
from ops_api.ops.document.exceptions import DocumentNotFoundError


def is_user_linked_to_agreement(user, agreement_id: int) -> bool:
    """
    Check the agreement table to see if the user is associated with the agreement.
    """
    agreement_stmt = select(Agreement).where(Agreement.id == agreement_id)
    agreement = current_app.db_session.scalar(agreement_stmt)

    if not agreement:
        return False

    # Check if the user is the project officer
    if agreement.project_officer_id == user.id:
        return True

    # Check if the user is a team member
    for team_member in agreement.team_members:
        if team_member.id == user.id:
            return True

    return False


def insert_new_document(document_data):
    """
    Insert a new document into the database.
    """
    document_record = Document(
        agreement_id=document_data["agreement_id"],
        created_by=current_user.id,
        document_type=document_data["document_type"],
        file_name=document_data["file_name"],
    )
    current_app.db_session.add(document_record)
    current_app.db_session.commit()

    return document_record


def set_document_status_by_id(document_id, status):
    """
    Update the status of a document in the database.
    """
    document_stmt = select(Document).where(Document.document_id == document_id)
    document = current_app.db_session.scalar(document_stmt)

    if not document:
        raise DocumentNotFoundError(f"Document with uuid {document_id} not found.")

    document.status = status
    current_app.db_session.commit()
