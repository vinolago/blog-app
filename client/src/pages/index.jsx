import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Edit3, Users } from "lucide-react";
import swyp_p_logo from "../assets/swyp_p_logo.svg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="https://swypstudio.co.ke" className="hover:opacity-80 transition-opacity">
                <img
                  src={swyp_p_logo}
                  alt="Swyp Logo"
                  className="h-8 w-24 sm:h-10 sm:w-32"
                />
              </a>
              <span className="text-xl font-bold">Blog</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
            <Button asChild>
              <Link to="/create-post">
                Write a post
                
              </Link>
            </Button>
                      
            <Button asChild>
              <Link to="/posts">
                Explore posts
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
            <span className="text-[#08f0a3]">
              Insights
            </span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Write, and share
            insightful articles about design, branding, technology and more.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">
                Log in
                
              </Link>
            </Button>
          </div>
        </div>
      </section>

    


      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-muted-foreground">
            <a href="https://swypstudio.co.ke" aria-label="Go to homepage" className="hover:!bg-transparent">
              <img
                src={swyp_p_logo}
                alt="Swyp Logo"
                className="h-4 w-16 sm:h-8 sm:w-24"
              />
            </a>
            
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
