
from django.urls import path
from myapp import views
from .views import ConnectionListView

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.handleLogin, name="handleLogin"),
    path("logout/", views.handleLogout, name="handleLogout"),

    path("uploaddata/", views.uploaddata, name="uploaddata"),

    # Read applicants/connections
    path("getApplicantsData/", ConnectionListView.as_view(), name="connection_list"),

    # Create applicant/connection
    path("create_applicant/", views.create_applicant, name="create_applicant"),

    # Update applicant/connection
    path("update_applicantData/<int:id>/", views.update_applicant, name="update_applicant"),

    # Delete applicant/connection
    path("delete_applicant/<int:id>/", views.delete_applicant, name="delete_applicant"),

    # Statistics
    path("Connectionvisualization/", views.connectionvisualization, name="Connectionvisualization"),
    path("Connectionrequestdata/", views.connectionrequestdata, name="Connectionrequestdata"),
]
