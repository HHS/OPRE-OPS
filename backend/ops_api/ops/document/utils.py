from enum import Enum, auto

from flask import current_app
from flask_jwt_extended import current_user
from loguru import logger
from sqlalchemy.future import select

from models import Agreement, Document, DocumentType
from ops_api.ops.document.exceptions import DocumentNotFoundError


class DocumentProviders(Enum):
    fake = auto()
    azure = auto()


def is_user_linked_to_agreement(user_id, agreement_id: int) -> bool:
    """
    Check the agreement table to see if the user is associated with the agreement.
    """
    agreement_stmt = select(Agreement).where(Agreement.id == agreement_id)
    agreement = current_app.db_session.scalar(agreement_stmt)

    if not agreement:
        return False

    # Check if the user is the project officer
    if agreement.project_officer_id == user_id:
        return True

    # Check if the user is a team member
    for team_member in agreement.team_members:
        if team_member.id == user_id:
            return True

    return False


def map_document_type_to_enum(document_type):
    """
    Map the document type string to the DocumentType enum.
    """
    # Built from the enum so a new DocumentType can't be left out (and silently map to None).
    document_type_mapping = {document_type_enum.name.lower(): document_type_enum for document_type_enum in DocumentType}

    return document_type_mapping.get(document_type.lower())


def insert_new_document(document_data):
    """
    Insert a new document into the database.
    """
    try:
        document_record = Document(
            agreement_id=document_data["agreement_id"],
            document_id=document_data["document_id"],
            document_type=map_document_type_to_enum(document_data["document_type"]),
            document_name=document_data["document_name"],
            document_size=document_data["document_size"],
            created_by=current_user.id,
        )
        current_app.db_session.add(document_record)
        current_app.db_session.commit()
    except Exception as e:
        print(f"Error inserting document: {e}")
        current_app.db_session.rollback()
        raise

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


def process_status_update(document_id, status):
    """
    Process the status update for a document.
    """
    try:
        set_document_status_by_id(document_id, status)
    except DocumentNotFoundError as e:
        logger.error(f"Document not found with uuid {document_id}: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to update document status: {e}")
        raise e


def get_by_agreement_id(agreement_id):
    """
    Get all documents associated with a specific agreement ID.
    """
    document_stmt = select(Document).where(Document.agreement_id == agreement_id)
    documents = current_app.db_session.execute(document_stmt).scalars().all()

    logger.debug(
        f"Agreement {agreement_id} has {len(documents)} documents."
        if documents
        else f"Agreement {agreement_id} has no documents."
    )

    return documents
