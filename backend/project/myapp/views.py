
from django.shortcuts import render, HttpResponse
from django.db.models.query import QuerySet
from django.db.models import Q, Count
from django.db import transaction
from django.db.models.functions import TruncMonth
from .models import Applicant, Connection, Status
from datetime import datetime
from django.views.generic import ListView
from typing import Any
from django.http import JsonResponse
from django.core.paginator import Paginator
import json
import pandas as pd
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout


# Create your views here.

def index(request):
    return HttpResponse("Django server is running successfully!")


def login(request):
    return render(request, "login.html")


def uploaddata(request):
    try:
        filepath = 'electricity_board_case_study.csv'
        df = pd.read_csv(filepath, encoding='latin-1')

        for index, row in df.iterrows():
            applicant, created = Applicant.objects.get_or_create(
                Applicant_Name=row['Applicant_Name'],
                Gender=row['Gender'],
                District=row['District'],
                State=row['State'],
                Pincode=row['Pincode'],
                Ownership=row['Ownership'],
                GovtID_Type=row['GovtID_Type'],
                ID_Number=row['ID_Number'],
                Category=row['Category']
            )

            status_obj, created = Status.objects.get_or_create(
                status_name=row['Status']
            )

            Date_of_Application = datetime.strptime(
                row['Date_of_Application'], "%d-%m-%Y"
            ).strftime("%Y-%m-%d")

            Date_of_Approval = None
            if not pd.isna(row['Date_of_Approval']):
                Date_of_Approval = datetime.strptime(
                    row['Date_of_Approval'], "%d-%m-%Y"
                ).strftime("%Y-%m-%d")

            Modified_Date = None
            if not pd.isna(row['Modified_Date']):
                Modified_Date = datetime.strptime(
                    row['Modified_Date'], "%d-%m-%Y"
                ).strftime("%Y-%m-%d")

            Connection.objects.get_or_create(
                Applicant=applicant,
                Load_Applied=row['Load_Applied'],
                Date_of_Application=Date_of_Application,
                Date_of_Approval=Date_of_Approval,
                Modified_Date=Modified_Date,
                Status=status_obj,
                Reviewer_ID=row['Reviewer_ID'],
                Reviewer_Name=row['Reviewer_Name'],
                Reviewer_Comments=row['Reviewer_Comments']
            )

        return HttpResponse("File data is uploaded or updated")

    except Exception as e:
        return HttpResponse(
            f"File data is not loaded or updated: {e}",
            status=400
        )


class ConnectionListView(ListView):
    model = Connection
    context_object_name = 'connection'
    paginate_by = 100

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'Applicant', 'Status'
        ).order_by('id')

        search_query = self.request.GET.get('search', '').strip()

        start_date_param = self.request.GET.get('start_date')
        end_date_param = self.request.GET.get('end_date')

        start_date = (
            parse_date(start_date_param) if start_date_param else None
        )
        end_date = (
            parse_date(end_date_param) if end_date_param else None
        )

        if search_query:
            queryset = queryset.filter(
                Q(Applicant__Applicant_Name__icontains=search_query)
                | Q(Applicant__District__icontains=search_query)
                | Q(Applicant__State__icontains=search_query)
                | Q(Applicant__Gender__icontains=search_query)
                | Q(Applicant__Category__icontains=search_query)
                | Q(Status__status_name__icontains=search_query)
                | Q(Reviewer_Name__icontains=search_query)
                | Q(Reviewer_Comments__icontains=search_query)
                | Q(Reviewer_ID__icontains=search_query)
            )

        if start_date:
            queryset = queryset.filter(
                Date_of_Application__gte=start_date
            )

        if end_date:
            queryset = queryset.filter(
                Date_of_Application__lte=end_date
            )

        return queryset.distinct()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search_query'] = self.request.GET.get('search', '')
        return context

    def render_to_response(self, context, **response_kwargs):
        connections = context['connection']

        serialized_data = [
            {
                'id': conn.id,
                'Applicant_ID': conn.Applicant.id,
                'Load_Applied': conn.Load_Applied,
                'Date_of_Application': conn.Date_of_Application,
                'Date_of_Approval': conn.Date_of_Approval,
                'Modified_Date': conn.Modified_Date,
                'Status': conn.Status.status_name,
                'Applicant': {
                    'Applicant_Name': conn.Applicant.Applicant_Name,
                    'Gender': conn.Applicant.Gender,
                    'District': conn.Applicant.District,
                    'State': conn.Applicant.State,
                    'Pincode': conn.Applicant.Pincode,
                    'Ownership': conn.Applicant.Ownership,
                    'GovtID_Type': conn.Applicant.GovtID_Type,
                    'ID_Number': conn.Applicant.ID_Number,
                    'Category': conn.Applicant.Category,
                },
                'Reviewer_ID': conn.Reviewer_ID,
                'Reviewer_Name': conn.Reviewer_Name,
                'Reviewer_Comments': conn.Reviewer_Comments,
            }
            for conn in connections
        ]

        paginator = Paginator(serialized_data, self.paginate_by)
        page_number = self.request.GET.get('page', 1)
        page_obj = paginator.get_page(page_number)

        response_data = {
            'data': page_obj.object_list,
            'search_query': context['search_query'],
            'total_pages': paginator.num_pages,
            'current_page': page_obj.number
        }

        return JsonResponse(response_data)


@csrf_exempt
def create_applicant(request):
    if request.method != 'POST':
        return JsonResponse(
            {'error': 'Method not allowed'},
            status=405
        )

    try:
        data = json.loads(request.body)

        applicant_data = data.get('applicant', {})
        connection_data = data.get('connection', {})

        required_applicant_fields = [
            'Applicant_Name', 'Gender', 'District', 'State',
            'Pincode', 'Ownership', 'GovtID_Type', 'ID_Number',
            'Category'
        ]

        for field in required_applicant_fields:
            if applicant_data.get(field) in (None, ''):
                return JsonResponse(
                    {'error': f'{field} is required'},
                    status=400
                )

        required_connection_fields = [
            'Load_Applied', 'Date_of_Application',
            'Reviewer_ID', 'Reviewer_Name', 'Reviewer_Comments'
        ]

        for field in required_connection_fields:
            if connection_data.get(field) in (None, ''):
                return JsonResponse(
                    {'error': f'{field} is required'},
                    status=400
                )

        application_date = parse_date(
            str(connection_data['Date_of_Application'])
        )

        if not application_date:
            return JsonResponse(
                {'error': 'Invalid Date_of_Application'},
                status=400
            )

        approval_date = connection_data.get('Date_of_Approval') or None
        modified_date = connection_data.get('Modified_Date') or None

        if approval_date:
            approval_date = parse_date(str(approval_date))
            if not approval_date:
                return JsonResponse(
                    {'error': 'Invalid Date_of_Approval'},
                    status=400
                )

        if modified_date:
            modified_date = parse_date(str(modified_date))
            if not modified_date:
                return JsonResponse(
                    {'error': 'Invalid Modified_Date'},
                    status=400
                )

        status_name = connection_data.get('Status')
        valid_statuses = dict(Status.STATUS_CHOICES)

        if status_name not in valid_statuses:
            return JsonResponse(
                {'error': 'Invalid status value'},
                status=400
            )

        valid_comments = dict(Connection.REVIEWER_COMMENTS_CHOICES)
        reviewer_comments = connection_data['Reviewer_Comments']

        if reviewer_comments not in valid_comments:
            return JsonResponse(
                {'error': 'Invalid Reviewer_Comments value'},
                status=400
            )

        with transaction.atomic():
            applicant = Applicant.objects.create(
                Applicant_Name=applicant_data['Applicant_Name'],
                Gender=applicant_data['Gender'],
                District=applicant_data['District'],
                State=applicant_data['State'],
                Pincode=int(applicant_data['Pincode']),
                Ownership=applicant_data['Ownership'],
                GovtID_Type=applicant_data['GovtID_Type'],
                ID_Number=applicant_data['ID_Number'],
                Category=applicant_data['Category']
            )

            status_obj, created = Status.objects.get_or_create(
                status_name=status_name
            )

            connection = Connection.objects.create(
                Applicant=applicant,
                Load_Applied=int(connection_data['Load_Applied']),
                Date_of_Application=application_date,
                Date_of_Approval=approval_date,
                Modified_Date=modified_date,
                Status=status_obj,
                Reviewer_ID=int(connection_data['Reviewer_ID']),
                Reviewer_Name=connection_data['Reviewer_Name'],
                Reviewer_Comments=reviewer_comments
            )

        return JsonResponse({
            'success': 'Applicant created successfully',
            'connection_id': connection.id,
            'applicant_id': applicant.id
        }, status=201)

    except (json.JSONDecodeError, ValueError, TypeError) as e:
        return JsonResponse({'error': str(e)}, status=400)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def update_applicant(request, id):
    try:
        # Frontend sends the Connection ID.
        connection = Connection.objects.select_related(
            'Applicant', 'Status'
        ).get(pk=id)

        applicant = connection.Applicant

        if request.method == 'GET':
            applicant_data = {
                'Applicant_Name': applicant.Applicant_Name,
                'Gender': applicant.Gender,
                'District': applicant.District,
                'State': applicant.State,
                'Pincode': applicant.Pincode,
                'Ownership': applicant.Ownership,
                'GovtID_Type': applicant.GovtID_Type,
                'ID_Number': applicant.ID_Number,
                'Category': applicant.Category
            }

            connection_data = {
                'Load_Applied': connection.Load_Applied,
                'Date_of_Application': connection.Date_of_Application,
                'Date_of_Approval': connection.Date_of_Approval,
                'Modified_Date': connection.Modified_Date,
                'Status': connection.Status.status_name,
                'Reviewer_ID': connection.Reviewer_ID,
                'Reviewer_Name': connection.Reviewer_Name,
                'Reviewer_Comments': connection.Reviewer_Comments
            }

            return JsonResponse({
                'applicant': applicant_data,
                'connection': connection_data
            })

        elif request.method == 'POST':
            data = json.loads(request.body)

            applicant_data = data.get('applicant', {})
            connection_data = data.get('connection', {})

            status_name = connection_data.get('Status')
            status_instance = Status.objects.filter(
                status_name=status_name
            ).first()

            if not status_instance:
                return JsonResponse(
                    {'error': 'Invalid status value'},
                    status=400
                )

            valid_comments = dict(Connection.REVIEWER_COMMENTS_CHOICES)
            reviewer_comments = connection_data.get('Reviewer_Comments')

            if reviewer_comments not in valid_comments:
                return JsonResponse(
                    {'error': 'Invalid Reviewer_Comments value'},
                    status=400
                )

            for key, value in applicant_data.items():
                if key in [
                    'Applicant_Name', 'Gender', 'District', 'State',
                    'Pincode', 'Ownership', 'GovtID_Type',
                    'ID_Number', 'Category'
                ]:
                    if key == 'Pincode':
                        value = int(value)
                    setattr(applicant, key, value)

            applicant.save()

            allowed_connection_fields = [
                'Load_Applied', 'Date_of_Application',
                'Date_of_Approval', 'Modified_Date',
                'Reviewer_ID', 'Reviewer_Name', 'Reviewer_Comments'
            ]

            for key, value in connection_data.items():
                if key not in allowed_connection_fields:
                    continue

                if key in ['Date_of_Approval', 'Modified_Date']:
                    value = value or None
                    if value:
                        value = parse_date(str(value))
                        if not value:
                            return JsonResponse(
                                {'error': f'Invalid {key}'},
                                status=400
                            )

                elif key == 'Date_of_Application':
                    value = parse_date(str(value))
                    if not value:
                        return JsonResponse(
                            {'error': 'Invalid Date_of_Application'},
                            status=400
                        )

                elif key in ['Load_Applied', 'Reviewer_ID']:
                    value = int(value)

                setattr(connection, key, value)

            connection.Status = status_instance
            connection.save()

            return JsonResponse({
                'success': 'Applicant details updated successfully'
            })

        return JsonResponse(
            {'error': 'Method not allowed'},
            status=405
        )

    except Connection.DoesNotExist:
        return JsonResponse(
            {'error': 'Connection not found'},
            status=404
        )

    except (json.JSONDecodeError, ValueError, TypeError) as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def delete_applicant(request, id):
    if request.method != 'DELETE':
        return JsonResponse(
            {'error': 'Method not allowed'},
            status=405
        )

    try:
        connection = Connection.objects.get(pk=id)
        applicant = connection.Applicant

        connection.delete()

        # Delete the applicant only if no other connections use it.
        if not Connection.objects.filter(Applicant=applicant).exists():
            applicant.delete()

        return JsonResponse({
            'success': 'Connection deleted successfully'
        })

    except Connection.DoesNotExist:
        return JsonResponse(
            {'error': 'Connection not found'},
            status=404
        )


def connectionvisualization(request):
    connection_requests = (
        Connection.objects
        .annotate(month=TruncMonth('Date_of_Application'))
        .values('month')
        .annotate(total_requests=Count('id'))
        .order_by('month')
    )

    labels = [
        entry['month'].strftime('%Y-%m')
        for entry in connection_requests
        if entry['month'] is not None
    ]

    total_requests = [
        entry['total_requests']
        for entry in connection_requests
        if entry['month'] is not None
    ]

    context = {
        'labels': labels,
        'total_requests': total_requests,
    }

    return render(
        request,
        'connectionvisualization.html',
        context
    )


def connectionrequestdata(request):
    selected_status = request.GET.get('status')

    if selected_status:
        filtered_connections = Connection.objects.filter(
            Status__status_name=selected_status
        )
    else:
        filtered_connections = Connection.objects.all()

    data = (
        filtered_connections
        .annotate(month=TruncMonth('Date_of_Application'))
        .values('month')
        .annotate(total_requests=Count('id'))
        .order_by('month')
    )

    labels = [
        entry['month'].strftime('%B %y')
        for entry in data
        if entry['month'] is not None
    ]

    total_requests = [
        entry['total_requests']
        for entry in data
        if entry['month'] is not None
    ]

    return JsonResponse({
        'labels': labels,
        'total_requests': total_requests
    })


@csrf_exempt
def handleLogin(request):
    if request.method != 'POST':
        return JsonResponse(
            {'error': 'Method not allowed'},
            status=405
        )

    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return JsonResponse(
                {'error': 'Username and password are required'},
                status=400
            )

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            auth_login(request, user)
            return JsonResponse({
                'user': user.username,
                'success': 'Login successful'
            }, status=200)

        return JsonResponse(
            {'error': 'Invalid credentials'},
            status=400
        )

    except (json.JSONDecodeError, TypeError, ValueError) as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def handleLogout(request):
    if request.method != 'POST':
        return JsonResponse(
            {'error': 'Method not allowed'},
            status=405
        )

    auth_logout(request)

    return JsonResponse({
        'success': 'Logout successful'
    })
