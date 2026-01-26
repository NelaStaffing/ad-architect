import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Layers, 
  Sparkles, 
  Zap, 
  Layout, 
  Image, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Palette
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">Ad Architect</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="btn-glow">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Ad Creation
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Create Print Ads in{' '}
              <span className="text-primary">Minutes</span>,{' '}
              Not Hours
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ad Architect uses AI to generate professional print-ready classified ads. 
              Upload your assets, describe your vision, and let AI do the heavy lifting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="btn-glow gap-2 text-base px-8">
                  Start Creating <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8">
                  Learn More
                </Button>
              </a>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="bg-muted/30 border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-4 text-sm text-muted-foreground">Ad Architect Editor</span>
              </div>
              <div className="p-8 bg-muted/10">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-3">
                    <div className="h-8 bg-primary/20 rounded animate-pulse" />
                    <div className="h-24 bg-muted rounded" />
                    <div className="h-24 bg-muted rounded" />
                  </div>
                  <div className="col-span-2 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center min-h-[200px]">
                    <div className="text-center text-muted-foreground">
                      <Layout className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">AI-Generated Ad Preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Print Ads
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From concept to print-ready output, Ad Architect streamlines your entire workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Generation</h3>
              <p className="text-muted-foreground">
                Describe your ad in plain language and let AI generate professional layouts instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Layout className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Publication Presets</h3>
              <p className="text-muted-foreground">
                Pre-configured sizes, bleeds, and safe zones for major publications. Always print-ready.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Asset Management</h3>
              <p className="text-muted-foreground">
                Upload product images and logos. AI automatically incorporates them into your designs.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Interactive Editor</h3>
              <p className="text-muted-foreground">
                Fine-tune your ads with drag-and-drop positioning and real-time preview.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Client Organization</h3>
              <p className="text-muted-foreground">
                Organize ads by client and publication. Track deadlines and manage revisions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Regeneration</h3>
              <p className="text-muted-foreground">
                Not happy with a layout? Regenerate with new instructions until it's perfect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create professional print ads in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Set Up Your Ad</h3>
              <p className="text-muted-foreground">
                Choose your publication, ad size, and upload your product images and logos.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Describe Your Vision</h3>
              <p className="text-muted-foreground">
                Write your ad copy and brief. Tell AI what style and layout you're looking for.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Generate & Export</h3>
              <p className="text-muted-foreground">
                AI generates your ad instantly. Fine-tune if needed, then download print-ready files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Built for Advertising Professionals
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're an agency handling multiple clients or a business creating your own ads, 
                Ad Architect saves you time without sacrificing quality.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Save Hours Per Ad</span>
                    <p className="text-sm text-muted-foreground">What used to take hours now takes minutes</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Always Print-Ready</span>
                    <p className="text-sm text-muted-foreground">Correct DPI, bleeds, and safe zones every time</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Consistent Quality</span>
                    <p className="text-sm text-muted-foreground">Professional layouts that meet publication standards</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Meet Tight Deadlines</span>
                    <p className="text-sm text-muted-foreground">Generate multiple versions quickly for client review</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">AI Generation</div>
                    <div className="text-sm text-muted-foreground">Powered by advanced AI models</div>
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">10x</div>
                    <div className="text-sm text-muted-foreground">Faster Creation</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">100%</div>
                    <div className="text-sm text-muted-foreground">Print-Ready</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Transform Your Ad Creation?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join agencies and businesses already using Ad Architect to create professional print ads faster.
            </p>
            <Link to="/auth">
              <Button size="lg" className="btn-glow gap-2 text-base px-8">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">Ad Architect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ad Architect. AI-powered print ad creation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
