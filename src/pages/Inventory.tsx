import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Inventory() {
  const { workspaceId, role } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("10");
  const [newThreshold, setNewThreshold] = useState("5");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchItems = async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from("inventory").select("*").eq("workspace_id", workspaceId).order("item_name");

      if (error) {
        console.error("Inventory error:", error);
        toast({ title: "Error fetching inventory", description: error.message, variant: "destructive" });
      }

      setItems(data || []);
    } catch (err) {
      console.error("Inventory fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [workspaceId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('inventory-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('inventory-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const addItem = async () => {
    if (!workspaceId || !newName) return;
    setIsUploading(true);

    let imageUrl = null;
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
    }

    const { error } = await supabase.from("inventory").insert({
      workspace_id: workspaceId, item_name: newName,
      quantity: parseInt(newQty), low_stock_threshold: parseInt(newThreshold),
      image_url: imageUrl
    });

    setIsUploading(false);

    if (error) {
      console.error("Inventory add failed:", error);
      toast({ title: "Error adding inventory", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Item added!" });
    setNewName(""); setNewQty("10"); setNewThreshold("5"); setSelectedImage(null);
    setDialogOpen(false);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Inventory</h1>
        {role === "admin" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add Inventory Item</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Item Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Cleaning Gloves" /></div>

                <div className="space-y-2">
                  <Label>Item Image (Optional)</Label>
                  <Input type="file" accept="image/*" onChange={handleImageChange} />
                  {selectedImage && <p className="text-xs text-muted-foreground">Selected: {selectedImage.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Low Stock At</Label><Input type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} /></div>
                </div>
                <Button onClick={addItem} disabled={isUploading} className="w-full gradient-primary text-primary-foreground">
                  {isUploading ? "Uploading..." : "Add Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>)}</div>
      ) : items.length === 0 ? (
        <Card className="shadow-card border-border/50">
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No inventory items yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const pct = Math.min(100, (item.quantity / Math.max(item.low_stock_threshold * 3, 1)) * 100);
            const isLow = item.quantity <= item.low_stock_threshold;
            return (
              <Card key={item.id} className="shadow-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.item_name} className="h-10 w-10 rounded-lg object-cover bg-muted" />
                      ) : (
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10`}>
                          <Package className={`h-5 w-5 ${isLow ? "text-destructive" : "text-primary"}`} />
                        </div>
                      )}
                      <span className="font-medium text-sm">{item.item_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      <Badge variant={isLow ? "destructive" : "secondary"}>{item.quantity} {item.unit || "units"}</Badge>
                    </div>
                  </div>
                  <Progress value={pct} className={`h-2 ${isLow ? "[&>div]:bg-destructive" : ""}`} />
                  <p className="text-xs text-muted-foreground mt-1">Alert threshold: {item.low_stock_threshold}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
