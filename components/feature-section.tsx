import { FileText, Image, Upload, Zap, ThumbsUp, Smartphone } from "lucide-react"

export function FeatureSection() {
  return (
    <section className="w-full py-12 md:py-24" id="features">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Everything You Need for Effective Studying
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Our platform provides all the tools you need to transform your lecture materials into effective study
              tools.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Content Flexibility</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Upload images, PDFs, or plain text to create your study sets.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-muted p-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Automatic Generation</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Our system automatically parses your content and creates flashcards.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-muted p-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Customizable Quantity</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Specify exactly how many flashcards you want to generate.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-muted p-3">
              <ThumbsUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Interactive Feedback</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Track your progress with thumbs up and down feedback on each card.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-muted p-3">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Responsive Design</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Study on any device with our fully responsive interface.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-muted p-3">
              <Image className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Visual Learning</h3>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Support for images and visual content to enhance your learning.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

