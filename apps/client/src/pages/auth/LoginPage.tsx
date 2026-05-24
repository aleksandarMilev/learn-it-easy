import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { GraduationCap, Users, Star } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { usersApi } from '@/api/users.api';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

export function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      setTokens(data.accessToken, data.refreshToken);
      const user = await usersApi.getMe();
      setUser({ id: user.id, email: user.email, role: user.role });
      navigate('/dashboard');
    },
  });

  return (
    <div className="flex min-h-screen">
      {/* Branding panel */}
      <div className="hidden flex-col justify-between bg-indigo-600 p-12 lg:flex lg:w-5/12">
        <Link to="/" className="flex items-center gap-2 text-white">
          <GraduationCap className="h-8 w-8" />
          <span className="text-2xl font-bold">LearnItEasy</span>
        </Link>

        <div className="space-y-10">
          <blockquote className="space-y-4">
            <p className="text-xl font-medium leading-relaxed text-indigo-100">
              "LearnItEasy helped me find the perfect tutor and improve my grades in just a few
              weeks."
            </p>
            <footer className="text-sm text-indigo-300">— Alex M., Student</footer>
          </blockquote>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Users, label: '500+', desc: 'Students' },
              { icon: GraduationCap, label: '50+', desc: 'Tutors' },
              { icon: Star, label: '4.9', desc: 'Avg. rating' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={desc} className="rounded-xl bg-indigo-700/50 p-4">
                <Icon className="mx-auto mb-1.5 h-5 w-5 text-indigo-300" />
                <p className="text-lg font-bold text-white">{label}</p>
                <p className="text-xs text-indigo-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-indigo-400">© 2025 LearnItEasy. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8">
            <div className="mb-5 flex items-center gap-2 lg:hidden">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
              <span className="text-lg font-bold text-indigo-600">LearnItEasy</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-2 text-gray-500">Sign in to your account to continue</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputClass}
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {mutation.isError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  Invalid email or password. Please try again.
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
