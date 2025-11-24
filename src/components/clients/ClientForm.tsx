
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "./ClientList";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";

interface ClientFormProps {
  client?: Client;
  onSuccess: () => void;
}

type FormData = Omit<Client, "id" | "created_at">;

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: client || {
      name: "",
      description: "",
      logo_url: "",
      website: "",
      industry: "",
      contact_email: "",
      contact_phone: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (!db) {
        throw new Error("Firestore not initialized");
      }

      if (client?.id) {
        const clientRef = doc(db, "clients", client.id);
        await updateDoc(clientRef, {
          ...data,
          updated_at: serverTimestamp()
        });

        toast({
          title: "Success",
          description: "Client updated successfully",
        });
      } else {
        await addDoc(collection(db, "clients"), {
          ...data,
          created_at: serverTimestamp()
        });

        toast({
          title: "Success",
          description: "Client created successfully",
        });
      }

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save client",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          {...register("industry")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            {...register("contact_email")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            {...register("contact_phone")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          {...register("website")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo_url">Logo URL</Label>
        <Input
          id="logo_url"
          {...register("logo_url")}
        />
      </div>

      <Button type="submit" className="w-full">
        {client ? "Update Client" : "Create Client"}
      </Button>
    </form>
  );
}
