

export default function Footer() {
  return (
    <footer className="border-t mt-10 bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Brand Info */}
        <div>
          <h2 className="text-xl font-bold mb-2">BlogVerse</h2>
          <p className="text-sm text-muted-foreground">
            Insightful stories, ideas, and updates from across technology, design, and business.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase">Quick Links</h3>
          <a href="/" className="hover:underline text-sm">Home</a>
          <a href="/about" className="hover:underline text-sm">About</a>
          <a href="/blog" className="hover:underline text-sm">Blog</a>
          <a href="/contact" className="hover:underline text-sm">Contact</a>
        </div>

        
      </div>

      <div className="border-t mt-6 pt-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} BlogVerse. All rights reserved.
      </div>
    </footer>
  );
}
