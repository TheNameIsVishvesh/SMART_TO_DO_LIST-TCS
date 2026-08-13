import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export default function Placeholder({ title, description, icon: Icon }) {
  return (
    <div className="p-6 sm:p-8 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full border-dashed border-2">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">{title} Integration Area</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">{description}</p>
            <div className="mt-6 bg-secondary p-4 rounded-md">
              <p className="text-sm font-medium">Ready for backend integration</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
