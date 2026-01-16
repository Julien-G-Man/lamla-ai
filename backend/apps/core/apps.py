from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    
    def ready(self):
        """Initialize async client when app is ready"""
        # Import here to avoid circular imports
        from .async_client import get_async_client
        # Pre-initialize the client
        get_async_client()
    
    def close(self):
        """Clean up async client on app shutdown"""
        import asyncio
        from .async_client import close_async_client
        
        try:
            # Try to close the client if event loop exists
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is running, schedule cleanup
                asyncio.create_task(close_async_client())
            else:
                loop.run_until_complete(close_async_client())
        except RuntimeError:
            # No event loop, create one
            asyncio.run(close_async_client())