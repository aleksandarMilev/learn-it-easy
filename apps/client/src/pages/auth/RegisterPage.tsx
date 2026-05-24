import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { GraduationCap, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { usersApi } from '@/api/users.api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/toast.store';

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['STUDENT', 'TUTOR']),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

const features = [
  'Book sessions with expert tutors',
  'Learn at your own schedule',
  'Real-time messaging with tutors',
  'Track your learning progress',
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'STUDENT' },
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      setTokens(data.accessToken, data.refreshToken);
      const user = await usersApi.getMe();
      setUser({ id: user.id, email: user.email, role: user.role });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    },
    onError: () => toast.error('Registration failed. Email may already be in use.'),
  });

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-col justify-between bg-indigo-600 p-12 lg:flex lg:w-5/12">
        <Link to="/" className="flex items-center gap-2 text-white">
          <GraduationCap className="h-8 w-8" />
          <span className="text-2xl font-bold">LearnItEasy</span>
        </Link>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Start learning today</h2>
            <p className="mt-3 text-lg text-indigo-100">
              Join thousands of students and tutors already using LearnItEasy.
            </p>
          </div>
          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-indigo-100">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-300" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-indigo-400">
          © {new Date().getFullYear()} LearnItEasy. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 py-12">
        <div className="animate-fade-in-up w-full max-w-md">
          <div className="mb-8">
            <div className="mb-5 flex items-center gap-2 lg:hidden">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
              <span className="text-lg font-bold text-indigo-600">LearnItEasy</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-2 text-gray-500">Get started in just a few seconds</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <input {...register('firstName')} placeholder="Alex" className={inputClass} />
                  {errors.firstName && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <input {...register('lastName')} placeholder="Smith" className={inputClass} />
                  {errors.lastName && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={inputClass}
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">I am a</label>
                <select {...register('role')} className={inputClass}>
                  <option value="STUDENT">Student — I want to learn</option>
                  <option value="TUTOR">Tutor — I want to teach</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
