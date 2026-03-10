import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">Lamla.ai</span>
            <span className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/ai-tutor" className="hover:text-foreground transition-colors">AI Tutor</Link>
            <Link href="/quiz/create" className="hover:text-foreground transition-colors">Quiz</Link>
            <Link href="/flashcards" className="hover:text-foreground transition-colors">Flashcards</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
