from django.urls import path
from . import views

urlpatterns = [
    path('materials/',                              views.MaterialListView.as_view()),
    path('materials/upload/',                       views.MaterialUploadView.as_view()),
    path('materials/mine/',                         views.MyMaterialsView.as_view()),
    path('materials/<int:material_id>/',            views.MaterialDetailView.as_view()),
    path('materials/<int:material_id>/download/',   views.MaterialDownloadView.as_view()),
    path('materials/<int:material_id>/extract/',    views.MaterialExtractView.as_view()),
    path('materials/<int:material_id>/delete/',     views.MaterialDeleteView.as_view()),
]