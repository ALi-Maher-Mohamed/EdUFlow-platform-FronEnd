import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Star, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold tracking-tight sm:text-6xl"
            >
              Master New Skills with <span className="text-primary">EduFlow</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-lg leading-8 text-muted-foreground"
            >
              Access high-quality courses from world-class instructors. Learn at your own pace, anywhere, anytime.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <Link to="/courses">
                <Button size="lg" className="gap-2">
                  Explore Courses <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/instructor">
                <Button variant="outline" size="lg">Teach on EduFlow</Button>
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:top-[-200px]">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="container">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-muted/50 border">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">1,000+ Courses</h3>
            <p className="text-muted-foreground">From web development to photography, we have it all.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-muted/50 border">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Expert Instructors</h3>
            <p className="text-muted-foreground">Learn from industry professionals with real-world experience.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-muted/50 border">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Star className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Lifetime Access</h3>
            <p className="text-muted-foreground">Enroll once and access your courses forever.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
