import os
import io
import logging
import time
from urllib.parse import urlparse
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

env = os.getenv("ENVIRONMENT", "dev")

SUBJECT_CHOICES = [
    {'value': 'mathematics', 'label': 'Mathematics'},
    {'value': 'sciences',    'label': 'Sciences'},
    {'value': 'engineering', 'label': 'Engineering'},
    {'value': 'computing',   'label': 'Computing'},
    {'value': 'humanities',  'label': 'Humanities'},
    {'value': 'business',    'label': 'Business'},
    {'value': 'languages',   'label': 'Languages'},
    {'value': 'medicine',    'label': 'Medicine'},
    {'value': 'law',         'label': 'Law'},
    {'value': 'arts',        'label': 'Arts'},
    {'value': 'other',       'label': 'Other'},
]

def _upload_file(file, user_id: int) -> str:
    """Upload to Cloudinary if STORAGE_BACKEND=cloudinary, else local media."""
    if os.getenv('STORAGE_BACKEND') == 'cloudinary':
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file,
            folder=f'lamla/{env}/materials/{user_id}',
            resource_type='raw',
            use_filename=True,
            unique_filename=True,
        )
        return result['secure_url']

    from django.core.files.storage import default_storage
    from django.core.files.base import ContentFile
    from django.conf import settings

    file.seek(0)
    path      = default_storage.save(f'materials/{user_id}/{file.name}', ContentFile(file.read()))
    return f'{settings.MEDIA_URL}{path}'


def _extract_cloudinary_public_id(file_url: str) -> str:
    """Extract Cloudinary public_id from a file URL when possible."""
    if not file_url:
        return ''

    try:
        parsed = urlparse(file_url)
        path = parsed.path or ''

        # Expected shape: /<resource_type>/<delivery_type>/v<version>/<public_id>
        # Example: /diagismkm/raw/upload/v1772816031/lamla/dev/materials/2/file.pdf
        marker = '/raw/'
        marker_idx = path.find(marker)
        if marker_idx == -1:
            return ''

        tail = path[marker_idx + len(marker):]  # upload/v177.../public_id
        parts = [p for p in tail.split('/') if p]
        if len(parts) < 3:
            return ''

        # Drop delivery type + version segment, keep remaining as public_id
        # parts[0] -> upload/authenticated/private
        # parts[1] -> v123...
        public_id = '/'.join(parts[2:])
        return public_id
    except Exception:
        logger.exception('Failed to parse Cloudinary public_id from URL')
        return ''


def _cloudinary_candidate_urls(file_url: str, original_filename: str = '') -> list[str]:
    """Build candidate URLs for accessing Cloudinary raw files (public/private/authenticated)."""
    urls = []
    if file_url:
        urls.append(file_url)

    if os.getenv('STORAGE_BACKEND') != 'cloudinary':
        return urls

    public_id = _extract_cloudinary_public_id(file_url)
    if not public_id:
        return urls

    try:
        import cloudinary.utils

        signed_upload_url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type='raw',
            type='upload',
            secure=True,
            sign_url=True,
        )
        urls.append(signed_upload_url)

        signed_auth_url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type='raw',
            type='authenticated',
            secure=True,
            sign_url=True,
        )
        urls.append(signed_auth_url)

        # For private/authenticated assets, these signed URLs are often the most reliable.
        # Cloudinary raw public_id may include the file extension depending on upload behavior,
        # so generate variants for both with-extension and without-extension forms.
        extension = (original_filename.rsplit('.', 1)[-1].lower() if '.' in (original_filename or '') else 'pdf')
        base_public_id = public_id.rsplit('.', 1)[0] if '.' in public_id else public_id
        expires_at = int(time.time()) + 3600

        urls.append(
            cloudinary.utils.private_download_url(
                base_public_id,
                extension,
                resource_type='raw',
                type='upload',
                attachment=True,
                expires_at=expires_at,
                filename=original_filename or None,
            )
        )
        urls.append(
            cloudinary.utils.private_download_url(
                base_public_id,
                extension,
                resource_type='raw',
                type='authenticated',
                attachment=True,
                expires_at=expires_at,
                filename=original_filename or None,
            )
        )

        urls.append(
            cloudinary.utils.private_download_url(
                public_id,
                extension,
                resource_type='raw',
                type='upload',
                attachment=True,
                expires_at=expires_at,
                filename=original_filename or None,
            )
        )
        urls.append(
            cloudinary.utils.private_download_url(
                public_id,
                extension,
                resource_type='raw',
                type='authenticated',
                attachment=True,
                expires_at=expires_at,
                filename=original_filename or None,
            )
        )
    except Exception:
        logger.exception('Failed building Cloudinary signed URLs')

    # Deduplicate while preserving order
    deduped = []
    seen = set()
    for url in urls:
        if not url or url in seen:
            continue
        seen.add(url)
        deduped.append(url)
    return deduped


def _extract_pdf_text(file_bytes: bytes) -> str:
    """pdfplumber → PyPDF2 fallback."""
    text = ''
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + '\n'
        if text.strip():
            return text.strip()
    except Exception:
        pass

    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + '\n'
    except Exception:
        pass

    return text.strip()

