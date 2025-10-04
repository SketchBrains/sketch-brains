import React from 'react';
import { Brain, Calendar, Award, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Layout } from '../components/Layout';

export function Home() {
  return (
    <Layout>
      <div className="space-y-16">
        <section className="text-center py-12">
          <Brain className="w-20 h-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Sketch Brains
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A trusted, professional event learning platform for college students. Master both soft
            skills and technical skills through engaging events.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="/events">
              <Button size="lg">Browse Events</Button>
            </a>
            <a href="/signup">
              <Button size="lg" variant="outline">
                Get Started
              </Button>
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 text-center">
            <Calendar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Diverse Events</h3>
            <p className="text-gray-600">
              Access both Soft Skills and Technical events designed specifically for college
              students
            </p>
          </Card>

          <Card className="p-8 text-center">
            <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Quality Materials</h3>
            <p className="text-gray-600">
              Download notes, slides, and recordings after each event for continued learning
            </p>
          </Card>

          <Card className="p-8 text-center">
            <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Referral Rewards</h3>
            <p className="text-gray-600">
              Refer 2 friends to technical events and get free access to events yourself
            </p>
          </Card>
        </section>

        <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              How Sketch Brains Works
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Create Your Account</h4>
                  <p className="text-gray-600">
                    Sign up with your email and get your unique referral code
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Browse and Register</h4>
                  <p className="text-gray-600">
                    Explore events, apply discount codes, and register securely with Razorpay
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Learn and Download</h4>
                  <p className="text-gray-600">
                    Attend events, access materials, and provide feedback
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Earn Rewards</h4>
                  <p className="text-gray-600">
                    Share your referral code and get free technical events when friends register
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students building their skills with Sketch Brains
          </p>
          <a href="/signup">
            <Button size="lg">Create Free Account</Button>
          </a>
        </section>
      </div>
    </Layout>
  );
}
