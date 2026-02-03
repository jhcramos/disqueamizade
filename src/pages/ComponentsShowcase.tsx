import { useState } from 'react'
import {
  Button,
  Avatar,
  Badge,
  Tooltip,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Modal,
  Toast,
} from '@/components/common'

export const ComponentsShowcase = () => {
  const [showModal, setShowModal] = useState(false)
  const [showToast, setShowToast] = useState(false)

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 p-8">
      <div className="container mx-auto">
        <h1 className="text-5xl font-bold text-white mb-8">
          Design System Components
        </h1>

        {/* Avatars */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-primary-light mb-6">Avatars</h2>
          <div className="card p-8">
            <div className="flex items-end gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Extra Small</p>
                <Avatar username="John" size="xs" status="online" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Small</p>
                <Avatar username="Mary" size="sm" status="online" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Medium</p>
                <Avatar username="Pedro" size="md" status="busy" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Large</p>
                <Avatar username="Ana" size="lg" status="offline" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Extra Large</p>
                <Avatar username="Carlos" size="xl" status="online" />
              </div>
            </div>

            <div className="border-t border-white/5 pt-6">
              <p className="text-sm text-gray-400 mb-4">Com imagem:</p>
              <Avatar
                src="https://i.pravatar.cc/150?img=1"
                alt="User"
                size="lg"
                status="online"
              />
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-primary-light mb-6">Badges</h2>
          <div className="card p-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-3">Subscription Tiers:</p>
                <div className="flex gap-3">
                  <Badge tier="free">Free</Badge>
                  <Badge tier="basic">Basic</Badge>
                  <Badge tier="premium">Premium</Badge>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <p className="text-sm text-gray-400 mb-3">Status Variants:</p>
                <div className="flex gap-3 flex-wrap">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <p className="text-sm text-gray-400 mb-3">Sizes:</p>
                <div className="flex items-center gap-3">
                  <Badge size="sm" variant="info">Small</Badge>
                  <Badge size="md" variant="info">Medium</Badge>
                  <Badge size="lg" variant="info">Large</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-primary-light mb-6">Buttons</h2>
          <div className="card p-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-3">Variants:</p>
                <div className="flex gap-3 flex-wrap">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <p className="text-sm text-gray-400 mb-3">Sizes:</p>
                <div className="flex items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <p className="text-sm text-gray-400 mb-3">States:</p>
                <div className="flex gap-3">
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-primary-light mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default" hover>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is a default card with hover effect.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="primary" hover>
              <CardHeader>
                <CardTitle>Primary Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Card with primary accent color.</p>
              </CardContent>
            </Card>

            <Card variant="accent" hover>
              <CardHeader>
                <CardTitle>Accent Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Card with accent (amber) color.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tooltips */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-primary-light mb-6">Tooltips</h2>
          <div className="card p-8">
            <div className="flex gap-6 justify-center">
              <Tooltip content="Top tooltip" position="top">
                <Button>Hover Top</Button>
              </Tooltip>
              <Tooltip content="Bottom tooltip" position="bottom">
                <Button>Hover Bottom</Button>
              </Tooltip>
              <Tooltip content="Left tooltip" position="left">
                <Button>Hover Left</Button>
              </Tooltip>
              <Tooltip content="Right tooltip" position="right">
                <Button>Hover Right</Button>
              </Tooltip>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-primary-light mb-6">Inputs</h2>
          <div className="card p-8 max-w-md">
            <div className="space-y-4">
              <Input label="Username" placeholder="Enter username" />
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
              />
              <Input
                label="With Error"
                placeholder="Input with error"
                error="This field is required"
              />
            </div>
          </div>
        </section>

        {/* Modal & Toast */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-primary-light mb-6">
            Modal & Toast
          </h2>
          <div className="card p-8">
            <div className="flex gap-4">
              <Button onClick={() => setShowModal(true)}>
                Show Modal
              </Button>
              <Button onClick={() => setShowToast(true)} variant="secondary">
                Show Toast
              </Button>
            </div>
          </div>
        </section>

        {/* Modals */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Example Modal"
        >
          <div className="space-y-4">
            <p className="text-gray-400">
              This is an example modal with clean modern styling.
            </p>
            <Input label="Name" placeholder="Enter your name" />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowModal(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>

        {/* Toast */}
        {showToast && (
          <Toast
            message="This is a success toast notification!"
            type="success"
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </div>
  )
}
