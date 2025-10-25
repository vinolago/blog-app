import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Edit3, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground"></span>
              </div>
              <span className="text-2xl font-bold">Dev Blog</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
            <Button asChild>
              <Link to="/login">
                Login
                
              </Link>
            </Button>
                      
            <Button asChild>
              <Link to="/register">
                Create account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-6xl font-bold tracking-tight">
            Share Your{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Developer Journey
            </span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Built for developers. Write, share, and discover
            insightful articles about web development, programming, and technology.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/posts">
                Explore Posts
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/posts/new">
                Write a Post
                <Edit3 className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-4xl font-bold">Why Dev Blog?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-8 text-center transition-smooth hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold">Rich Content</h3>
              <p className="text-muted-foreground">
                Write beautiful posts with Markdown support, code syntax highlighting, and more.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-8 text-center transition-smooth hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold">Developer Community</h3>
              <p className="text-muted-foreground">
                Connect with fellow developers and share knowledge in a supportive environment.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-8 text-center transition-smooth hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Edit3 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold">Easy Publishing</h3>
              <p className="text-muted-foreground">
                Simple, intuitive interface to write and publish your posts in minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-4xl font-bold">Ready to Start Writing?</h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Join our community of developers and share your insights with the world.
          </p>
          <Button size="lg" asChild>
            <Link to="/posts/new">
              Create Your First Post
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 Dev Blog. All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
