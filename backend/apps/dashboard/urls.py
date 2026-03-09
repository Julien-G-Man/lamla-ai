from django.urls import path
from . import views

urlpatterns = [
    # user
    path('dashboard/stats/',                      views.DashboardStatsView.as_view()),
    path('dashboard/contact/',                    views.ContactMessageView.as_view()),
    path('dashboard/newsletter/',                 views.NewsletterSubscribeView.as_view()),
    path('dashboard/quiz-feedback/',              views.QuizFeedbackView.as_view()),
    
    # admin
    path('dashboard/admin/stats/',                views.AdminDashboardStatsView.as_view()),
    path('dashboard/admin/usage-trends/',         views.AdminUsageTrendsView.as_view()),
    path('dashboard/admin/activity/',             views.AdminActivityFeedView.as_view()),
    path('dashboard/admin/users/',                views.AdminUsersListView.as_view()),
    path('dashboard/admin/users/<int:user_id>/',  views.AdminUserDeleteView.as_view()),
    path('dashboard/admin/settings/',             views.AdminSystemSettingsView.as_view()),
    path('dashboard/admin/quiz-feedback/',        views.AdminQuizFeedbackListView.as_view()),
]
