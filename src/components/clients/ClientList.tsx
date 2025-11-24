
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pen, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";

export type Client = {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

interface ClientListProps {
  onEdit: (client: Client) => void;
}

export function ClientList({ onEdit }: ClientListProps) {
  const { toast } = useToast();
  
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      if (!db) return [];

      const clientsRef = collection(db, "clients");
      const q = query(clientsRef, orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Client[];
    },
  });

  const handleDelete = async (id: string) => {
    try {
      if (!db) {
        throw new Error("Firestore not initialized");
      }

      await deleteDoc(doc(db, "clients", id));

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading clients...</div>;
  }

  if (error) {
    return <div>Error loading clients</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Website</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients?.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.industry || "N/A"}</TableCell>
              <TableCell>
                {client.contact_email && (
                  <div>{client.contact_email}</div>
                )}
                {client.contact_phone && (
                  <div className="text-sm text-muted-foreground">
                    {client.contact_phone}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {client.website ? (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit website
                  </a>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  onClick={() => onEdit(client)}
                  variant="outline"
                  size="icon"
                >
                  <Pen className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(client.id)}
                  variant="outline"
                  size="icon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
