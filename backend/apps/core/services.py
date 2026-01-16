# core/services.py
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import logging
from core.exceptions import FileProcessingError

logger = logging.getLogger(__name__)

# This service encapsulates the logic for file operations, making
# it easy to switch storage backends (e.g., from local to S3)
# without changing code in other apps.
class FileService:
    """
    A service class for handling all file-related operations,
    such as uploading and managing files.
    """
    @staticmethod
    def upload_file(file_content, filename):
        """
        Uploads a file to the configured storage backend.
        
        Args:
            file_content: The file content as bytes or a file-like object.
            filename (str): The desired name of the file.
            
        Returns:
            str: The URL of the uploaded file.
            
        Raises:
            FileProcessingError: If the upload fails.
        """
        try:
            path = default_storage.save(filename, ContentFile(file_content))
            return default_storage.url(path)
        except Exception as e:
            logger.error(f"Failed to upload file {filename}: {e}")
            raise FileProcessingError(f"Failed to upload file: {filename}") from e

# This service handles email sending logic. Encapsulating this here
# means any app can send an email without knowing the underlying
# email backend details.
class EmailService:
    """
    A service class for sending emails.
    """
    @staticmethod
    def send_email(subject, message, recipient_list):
        """
        Sends an email.
        
        Args:
            subject (str): The subject of the email.
            message (str): The body of the email.
            recipient_list (list): A list of recipient email addresses.
        """
        # Placeholder for actual email sending logic.
        # This is where you would integrate with Django's send_mail or a
        # more robust library like django-anymail.
        # For now, we'll just log the action.
        logger.info(f"Sending email with subject '{subject}' to {recipient_list}")
        # import send_mail from django.core.mail if needed later
        # send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)

