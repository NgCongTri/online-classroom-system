import email
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import User, Class, Session, ClassMembership, Attendance

class AuthAPI(APITestCase):
    def test_register_admin(self):
        data = {
            'username': 'new_admin',
            'email': 'new_admin@gmail.com',
            'password': 'Admin@123',
            'role': 'admin'
        }
        response = self.client.post(reverse('register'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.get(username='new_admin')
        self.assertEqual(user.role, 'admin')

    def test_register_lecturer(self):
        data = {
            'username': 'new_lecturer',
            'email': 'new_lecturer@gmail.com',
            'password': 'Admin@123',
            'role': 'lecturer'
        }
        response = self.client.post(reverse('register'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.get(username='new_lecturer')
        self.assertEqual(user.role, 'lecturer')

    def test_register_student(self):
        data = {
            'username': 'new_student',
            'email': 'new_student@gmail.com',
            'password': 'Student@123', 
            'role': 'student'
        }
        response = self.client.post(reverse('register'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.get(username='new_student')
        self.assertEqual(user.role, 'student')

    def test_register_with_invalid_role(self):
        data = {
            'username': 'new_invalid',
            'email': 'new_invalid@gmail.com',
            'password': 'Admin@123',
            'role': 'admin'
        }
        response = self.client.post(reverse('register'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 0)

    def test_register_with_duplicate_username(self):
        User.objects.create_user(username='dup_user', email='dup1@gmail.com', password='Admin@123', role='lecturer')
        data = {
            'username': 'dup_user',
            'email': 'dup2@gmail.com',
            'password': 'Admin@123',
            'role': 'student'
        }
        response = self.client.post(reverse('register'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 1)
        self.assertIn('username', str(response.content))

    def test_register_with_weak_password(self):
        data = {
            'username': 'weak_pass',
            'email': 'weak@gmail.com',
            'password': 'weak',
            'role': 'lecturer'
        }
        response = self.client.post(reverse('register'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', str(response.content))

    def test_login(self):
        user = User.objects.create_user(username='test_login', email='test_login@gmail.com', password='Admin@123', role='lecturer')
        data = {
            'email': 'test_login@gmail.com',
            'password': 'Admin@123'
        }
        response = self.client.post(reverse('login'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'test_login@gmail.com')
        self.assertEqual(response.data['user']['role'], 'lecturer')

class ClassesTestAPI(APITestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(username='kimtuoi', email='kimtuoi@gmail.com', password='Admin@123', role='lecturer')
        self.client.force_authenticate(self.lecturer)

    def test_create_class(self):
        data = {
            'name': 'Test Class',
            'description': 'Test Description',
            'start_date': '2025-09-16',
            'end_date': '2025-09-17'
        }
        response = self.client.post(reverse('class-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Class.objects.count(), 1)
    
    def test_create_class_with_student(self):
        self.student = User.objects.create_user(username='student', email='student@gmail.com', password='Admin@123', role='student')
        self.client.force_authenticate(self.student)
        data = {
            'name': 'Test Class',
            'description': 'Test Description',
            'start_date': '2025-09-16',
            'end_date': '2025-09-17'
        }
        response = self.client.post(reverse('class-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Class.objects.count(), 0)

class SessionsTestAPI(APITestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(username='kimtuoi', email='kimtuoi@gmail.com', password='Admin@123', role='lecturer')
        self.class_obj = Class.objects.create(name='Test Class', description='Test Description', start_date='2025-09-16', end_date='2025-09-17', lecturer=self.lecturer)
        self.client.force_authenticate(self.lecturer)

    def test_create_session(self):
        data = {
            'class_id': self.class_obj.id,
            'topic': 'Test Session',
            'date': '2025-09-16 10:00:00'
        }
        response = self.client.post(reverse('session-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Session.objects.count(), 1)

class InviteTestAPI(APITestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(username='kimtuoi', email='kimtuoi@gmail.com', password='Admin@123', role='lecturer')
        self.student = User.objects.create_user(username='congtri', email='congtri@gmail.com', password='Student@123', role='student')
        self.class_obj = Class.objects.create(name='Test Class', description='Test Description', start_date='2025-09-16', end_date='2025-09-17', lecturer=self.lecturer)
        self.client.force_authenticate(self.lecturer)

    def test_invite_student(self):
        data = {
            'user': self.student.id,
            'class_id': self.class_obj.id,
            'role': 'student'
        }
        response = self.client.post(reverse('invite-user'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ClassMembership.objects.count(), 1)

class AttendanceTestAPI(APITestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(username='kimtuoi', email='kimtuoi@gmail.com', password='Admin@123', role='lecturer')
        self.student = User.objects.create_user(username='congtri', email='congtri@gmail.com', password='Student@123', role='student')
        self.class_obj = Class.objects.create(name='Test Class', description='Test Description', start_date='2025-09-16', end_date='2025-09-17', lecturer=self.lecturer)
        self.session_obj = Session.objects.create(class_id=self.class_obj, topic='Test Session', date='2025-09-16 10:00:00')
        self.client.force_authenticate(self.student)

    def test_mark_attendance(self):
        data = {
            'session': self.session_obj.id
        }
        response = self.client.post(reverse('attendance'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Attendance.objects.count(), 1)

    def test_mark_attendance_duplicate(self):
        Attendance.objects.create(session=self.session_obj, user=self.student, is_verified=True)
        data = {
            'session': self.session_obj.id
        }
        response = self.client.post(reverse('attendance'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Attendance.objects.count(), 1)