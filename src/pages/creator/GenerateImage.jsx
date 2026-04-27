import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { Image } from 'lucide-react'

export default function GenerateImage() {
  const { hasAICreator } = useBilling()
  if (!hasAICreator) return <ToolGate tool="creator" />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Generate Image</h1>
      <Card>
        <div className="space-y-4">
          <Input label="Image prompt" placeholder="e.g. A plumber fixing pipes in a modern home, professional photo style" />
          <Button className="w-full" size="lg">
            <Image className="w-4 h-4" /> Generate Image
          </Button>
        </div>
      </Card>
      <div className="mt-8">
        <EmptyState icon={Image} title="No images yet" description="Generated images will appear here." />
      </div>
    </div>
  )
}
