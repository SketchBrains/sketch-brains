import React from 'react';
import {
  GraduationCap,
  Calendar,
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  Shield,
  Zap,
  Heart,
  Target,
  BookOpen,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Layout } from '../components/Layout';

export function Home() {
  const features = [
    {
      icon: <GraduationCap className="w-12 h-12 text-blue-600" />,
      title: 'Expert-Led Workshops',
      description:
        'Learn from industry professionals Amena Yasmeen (Soft Skills) and Parth Asawa (Technical Skills)',
    },
    {
      icon: <Award className="w-12 h-12 text-emerald-600" />,
      title: 'Verified Certificates',
      description:
        'Earn recognized certificates upon completion to boost your resume and LinkedIn profile',
    },
    {
      icon: <Users className="w-12 h-12 text-orange-600" />,
      title: 'Referral Rewards',
      description:
        'Refer 2 friends to technical events and get free access to premium workshops',
    },
    {
      icon: <BookOpen className="w-12 h-12 text-cyan-600" />,
      title: 'Comprehensive Materials',
      description:
        'Access notes, slides, and recordings after each session for continued learning',
    },
  ];

  const stats = [
    { number: '500+', label: 'Students Enrolled' },
    { number: '50+', label: 'Workshops Completed' },
    { number: '4.8/5', label: 'Average Rating' },
    { number: '95%', label: 'Satisfaction Rate' },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      college: 'IIT Delhi',
      text: 'The soft skills workshop with Amena transformed my confidence. Highly recommend!',
      rating: 5,
    },
    {
      name: 'Rahul Verma',
      college: 'NIT Trichy',
      text: 'Parth\'s technical workshops are practical and industry-relevant. Best investment!',
      rating: 5,
    },
    {
      name: 'Ananya Patel',
      college: 'BITS Pilani',
      text: 'Amazing platform! The materials provided helped me even after the workshop ended.',
      rating: 5,
    },
  ];

  const instructors = [
    {
      name: 'Amena Yasmeen',
      role: 'Soft Skills Expert',
      expertise: 'Communication, Leadership, Professional Development',
      image: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      name: 'Parth Asawa',
      role: 'Technical Expert',
      expertise: 'Web Development, React, Node.js, Cloud Technologies',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
  ];

  return (
    <Layout>
      <div className="space-y-20">
        <section className="relative py-20 -mx-6 px-6 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-grid-pattern"></div>
          </div>

          <div className="relative max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Trusted by 500+ Students</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Master Skills That
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Matter for Your Career
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Join Sketch Brains - India's premier platform for college students to learn soft skills
              and technical skills from industry experts
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <a href="/events">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl">
                  <Calendar className="w-5 h-5 mr-2" />
                  Explore Workshops
                </Button>
              </a>
              <a href="/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10"
                >
                  Get Started Free
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>No Hidden Fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </section>

        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Sketch Brains?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Affordable, accessible, and designed specifically for college students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="relative py-16 -mx-6 px-6 bg-gradient-to-r from-emerald-50 to-cyan-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Your Instructors</h2>
              <p className="text-xl text-gray-600">Learn from the best in the industry</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {instructors.map((instructor, index) => (
                <Card
                  key={index}
                  className="overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <img
                    src={instructor.image}
                    alt={instructor.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{instructor.name}</h3>
                    <p className="text-blue-600 font-semibold mb-3">{instructor.role}</p>
                    <p className="text-gray-600 leading-relaxed">{instructor.expertise}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-xl p-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: 'Create Your Account',
                  description:
                    'Sign up for free and get your unique referral code. No credit card required.',
                  icon: <Target className="w-6 h-6" />,
                },
                {
                  step: 2,
                  title: 'Choose Your Workshop',
                  description:
                    'Browse our catalog of soft skills and technical workshops. Filter by category and instructor.',
                  icon: <Calendar className="w-6 h-6" />,
                },
                {
                  step: 3,
                  title: 'Secure Payment',
                  description:
                    'Complete registration with our secure Razorpay integration. Apply coupon codes for discounts.',
                  icon: <Shield className="w-6 h-6" />,
                },
                {
                  step: 4,
                  title: 'Learn & Earn',
                  description:
                    'Attend workshops, download materials, and refer friends to earn free access.',
                  icon: <Zap className="w-6 h-6" />,
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-blue-600">{item.icon}</div>
                      <h4 className="text-xl font-bold text-gray-900">{item.title}</h4>
                    </div>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Students Say</h2>
            <p className="text-xl text-gray-600">Don't just take our word for it</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.college}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="relative py-16 -mx-6 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-3xl overflow-hidden">
          <div className="relative text-center max-w-3xl mx-auto">
            <Heart className="w-16 h-16 mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Future?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students who are building their career with Sketch Brains. Starting
              at just ₹49 per workshop.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="/signup">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl">
                  Create Free Account
                </Button>
              </a>
              <a href="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10"
                >
                  Browse Workshops
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm">
                All payments processed through Razorpay with bank-level encryption
              </p>
            </div>
            <div>
              <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Verified Certificates</h3>
              <p className="text-gray-600 text-sm">
                Earn certificates recognized by top companies and institutions
              </p>
            </div>
            <div>
              <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">
                Our team is always here to help you succeed in your learning journey
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
