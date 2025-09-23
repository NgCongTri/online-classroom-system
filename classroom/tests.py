import email
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import User, Class, Session, ClassMembership, Attendance, Material, Announcement
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response

class AuthAPI(APITestCase):
    def test_register_admin(self):
        data = {
            'username': 'new_admin',
            'email': 'new_admin@gmail.com',
            'password': 'Admin@123',
            'role': 'admin'
        }
        response = self.client.post(reverse('register'), data, format='json')
        print(response.content)
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
            'role': 'none'
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
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['role'], 'lecturer')

    def test_logout(self):
        # Tạo user và force authenticate
        user = User.objects.create_user(username='test_logout', email='test_logout@gmail.com', password='Admin@123', role='lecturer')
        self.client.force_authenticate(user=user)
        
        response = self.client.post(reverse('logout'), format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_token_refresh(self):
        user = User.objects.create_user(
            username='test_refresh',
            email='test_refresh@gmail.com',
            password='Admin@123',
            role='lecturer'
        )
        refresh = RefreshToken.for_user(user)

        self.client.cookies['refresh_token'] = str(refresh)

        response = self.client.post(reverse('token_refresh'), {}, format="json")

        print(response.content)  

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)  
        self.assertEqual(response.data['message'], 'Token refreshed successfully')

class ClassesTestAPI(APITestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(username='kimtuoi', email='kimtuoi@gmail.com', password='Admin@123', role='lecturer')
        self.student = User.objects.create_user(username='congtri', email='congtri@gmail.com', password='Student@123', role='student')

    def test_create_class(self):
        self.client.force_authenticate(user=self.lecturer)
        data = {
            'name': 'Test Class',
            'description': 'Test Description',
            'start_date': '2025-09-16',
            'end_date': '2025-09-17',
        }
        response = self.client.post(reverse('class-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Class.objects.count(), 1)
        self.assertEqual(Class.objects.get().name, 'Test Class')

    def test_create_class_as_student(self):
        self.client.force_authenticate(user=self.student)
        data = {
            'name': 'Test Class',
            'description': 'Test Description',
            'start_date': '2025-09-16',
            'end_date': '2025-09-17',
        }
        response = self.client.post(reverse('class-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Class.objects.count(), 0)

    def test_create_class_with_custom_code(self):
        self.client.force_authenticate(user=self.lecturer)
        data = {
            'name': 'Custom Code Class',
            'description': 'Test',
            'start_date': '2025-09-16',
            'end_date': '2025-09-17',
            'class_code': 'MYCODE123'  # Đặt thủ công
        }
        response = self.client.post(reverse('class-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cls = Class.objects.get()
        self.assertEqual(cls.class_code, 'MYCODE123')

    def test_create_class_without_code(self):
        self.client.force_authenticate(user=self.lecturer)
        data = {
            'name': 'No Code Class',
            'description': 'Test',
            'start_date': '2025-09-16',
            'end_date': '2025-09-17',
        }
        response = self.client.post(reverse('class-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cls = Class.objects.get()
        self.assertIsNone(cls.class_code)  # Không generate

    def test_create_class_with_empty_code(self):
        self.client.force_authenticate(user=self.lecturer)
        data = {
            'name': 'Empty Code Class',
            'description': 'Test',
            'start_date': '2025-09-16',
            'end_date': '2025-09-17',
            'class_code': ''  # Để trống
        }
        response = self.client.post(reverse('class-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cls = Class.objects.get()
        self.assertIsNone(cls.class_code)  # Không generate

    def test_enroll_without_code(self):
        # Tạo lớp với class_code=None, is_open_enrollment=True
        cls = Class.objects.create(name='Open Class', start_date='2025-09-16', end_date='2025-09-17', lecturer=self.lecturer, is_open_enrollment=True, class_code=None)
        self.client.force_authenticate(user=self.student)
        
        data = {'class_id': cls.id}
        response = self.client.post(reverse('enroll-class'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ClassMembership.objects.count(), 1)

    def test_enroll_with_code(self):
        # Tạo lớp với class_code, is_open_enrollment=True
        cls = Class.objects.create(name='Coded Class', start_date='2025-09-16', end_date='2025-09-17', lecturer=self.lecturer, is_open_enrollment=True, class_code='MYCODE123')
        self.client.force_authenticate(user=self.student)
        
        data = {'class_code': 'MYCODE123'}
        response = self.client.post(reverse('enroll-class'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ClassMembership.objects.count(), 1)

    def test_enroll_with_invalid_code(self):
        # Tạo lớp với class_code, is_open_enrollment=True
        cls = Class.objects.create(name='Coded Class', start_date='2025-09-16', end_date='2025-09-17', lecturer=self.lecturer, is_open_enrollment=True, class_code='MYCODE123')
        self.client.force_authenticate(user=self.student)
        
        data = {'class_code': 'WRONGCODE'}
        response = self.client.post(reverse('enroll-class'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ClassMembership.objects.count(), 0)

class SessionsTestAPI(APITestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(username='kimtuoi', email='kimtuoi@gmail.com', password='Admin@123', role='lecturer')
        self.class_obj = Class.objects.create(name='Test Class', description='Test Description', start_date='2025-09-16', end_date='2025-09-17', lecturer=self.lecturer)

    def test_create_session(self):
        self.client.force_authenticate(user=self.lecturer)
        data = {
            'class_id': self.class_obj.id,
            'topic': 'Test Session',
            'date': '2025-09-16T10:00:00Z'
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

    def test_invite_student(self):
        self.client.force_authenticate(user=self.lecturer)
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
        # Enroll student to class first
        ClassMembership.objects.create(user=self.student, class_id=self.class_obj, role='student')

    def test_mark_attendance(self):
        self.client.force_authenticate(user=self.student)
        data = {
            'session': self.session_obj.id
        }
        response = self.client.post(reverse('attendance'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Attendance.objects.count(), 1)

    def test_mark_attendance_duplicate(self):
        self.client.force_authenticate(user=self.student)
        Attendance.objects.create(session=self.session_obj, user=self.student, is_verified=True)
        data = {
            'session': self.session_obj.id
        }
        response = self.client.post(reverse('attendance'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Attendance.objects.count(), 1)

class MaterialTestAPI(APITestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(username='kimtuoi', email='kimtuoi@gmail.com', password='Admin@123', role='lecturer')
        self.student = User.objects.create_user(username='congtri', email='congtri@gmail.com', password='Student@123', role='student')
        self.class_obj = Class.objects.create(name='Test Class', description='Test Description', start_date='2025-09-16', end_date='2025-09-17', lecturer=self.lecturer)

    def test_create_material(self):
        self.client.force_authenticate(user=self.lecturer)
        data = {
            'class_id': self.class_obj.id,
            'title': 'Test Material',
            'file': SimpleUploadedFile('test.pdf', b'file_content', content_type='application/pdf')
        }
        response = self.client.post(reverse('material-list-create'), data, format='multipart')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Material.objects.count(), 1)

    def test_create_material_as_student(self):
        self.client.force_authenticate(user=self.student)
        data = {
            'class_id': self.class_obj.id,
            'title': 'Test Material',
            'file': SimpleUploadedFile('test.pdf', b'file_content', content_type='application/pdf')
        }
        response = self.client.post(reverse('material-list-create'), data, format='multipart')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Material.objects.count(), 0)

class AnnouncementTestAPI(APITestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(username='kimtuoi', email='kimtuoi@gmail.com', password='Admin@123', role='lecturer')
        self.student = User.objects.create_user(username='congtri', email='congtri@gmail.com', password='Student@123', role='student')
        self.class_obj = Class.objects.create(name='Test Class', description='Test Description', start_date='2025-09-16', end_date='2025-09-17', lecturer=self.lecturer)

    def test_create_announcement(self):
        self.client.force_authenticate(user=self.lecturer)
        data = {
            'class_id': self.class_obj.id,
            'title': 'Test Announcement',
            'content': 'Test Content'
        }
        response = self.client.post(reverse('announcement-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Announcement.objects.count(), 1)

    def test_create_announcement_as_student(self):
        self.client.force_authenticate(user=self.student)
        data = {
            'class_id': self.class_obj.id,
            'title': 'Test Announcement',
            'content': 'Test Content'
        }
        response = self.client.post(reverse('announcement-list-create'), data, format='json')
        print(response.content)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Announcement.objects.count(), 0)