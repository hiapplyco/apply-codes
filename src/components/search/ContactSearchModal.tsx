import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Loader2,
  User,
  Building2,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  Linkedin,
  AlertCircle,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { functionBridge } from "@/lib/function-bridge";

interface ContactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchParams?: {
    name?: string;
    company?: string;
    location?: string;
  };
}

interface SearchResult {
  uuid: string;
  name: string;
  first_name: string;
  last_name: string;
  location: string;
  country: string;
  job_title: string;
  company: string;
  industry: string;
  work_email: string;
  personal_emails: string[];
  mobile_phone: string;
  linkedin_username: string;
  linkedin_url: string;
  hasContactInfo: boolean;
}

export const ContactSearchModal: React.FC<ContactSearchModalProps> = ({
  isOpen,
  onClose,
  initialSearchParams = {}
}) => {
  // Search form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState(initialSearchParams.company || '');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(initialSearchParams.location || '');
  const [industry, setIndustry] = useState('');
  
  // Results state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState<SearchResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Parse initial name if provided
  React.useEffect(() => {
    if (initialSearchParams.name) {
      const parts = initialSearchParams.name.split(' ');
      if (parts.length >= 2) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(' '));
      } else {
        setFirstName(initialSearchParams.name);
      }
    }
  }, [initialSearchParams.name]);

  const handleSearch = async () => {
    // Validate that at least one field is filled
    if (!firstName && !lastName && !company && !title && !location && !industry) {
      toast.error('Please fill at least one search field');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSelectedPerson(null);

    try {
      const searchParams: any = {};
      if (firstName) searchParams.first_name = firstName;
      if (lastName) searchParams.last_name = lastName;
      if (company) searchParams.company = company;
      if (title) searchParams.title = title;
      if (location) searchParams.location = location;
      if (industry) searchParams.industry = industry;

      console.log('Searching with params:', searchParams);

      const results = await functionBridge.searchContacts({ searchParams });

      console.log('Search results:', results);

      if (results?.error) {
        throw new Error(results.error);
      }

      if (results?.data && results.data.length > 0) {
        setSearchResults(results.data);
        setTotalResults(results.total);
        toast.success(`Found ${results.total} contact${results.total > 1 ? 's' : ''}`);
      } else {
        toast.info('No contacts found matching your search criteria');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to search contacts');
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const renderContactInfo = (person: SearchResult) => {
    const allEmails = [
      ...(person.work_email ? [{ type: 'Work', email: person.work_email }] : []),
      ...(person.personal_emails || []).map(email => ({ type: 'Personal', email }))
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{person.name}</h3>
            {person.job_title && person.company && (
              <p className="text-sm text-gray-600">
                {person.job_title} at {person.company}
              </p>
            )}
            {person.location && (
              <p className="text-sm text-gray-500">{person.location}</p>
            )}
          </div>
          {person.linkedin_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(person.linkedin_url, '_blank')}
            >
              <Linkedin className="w-4 h-4 mr-1" />
              View Profile
            </Button>
          )}
        </div>

        {allEmails.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email Addresses</Label>
            {allEmails.map((emailInfo, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 group">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-xs text-gray-500">{emailInfo.type}</span>
                    <p className="text-sm font-medium">{emailInfo.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(emailInfo.email, 'Email')}
                  className="opacity-0 group-hover:opacity-100"
                >
                  {copiedField === 'Email' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {person.mobile_phone && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Phone</Label>
            <div className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 group">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium">{person.mobile_phone}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(person.mobile_phone, 'Phone')}
                className="opacity-0 group-hover:opacity-100"
              >
                {copiedField === 'Phone' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {!person.hasContactInfo && (
          <div className="flex items-center gap-2 p-3 rounded bg-amber-50 text-amber-800">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">No contact information available for this person</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Search for Contact Information</DialogTitle>
          <DialogDescription>
            Search for people by name, company, location, or other criteria to find their contact information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Apple"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="Software Engineer"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="San Francisco"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="Technology"
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFirstName('');
                setLastName('');
                setCompany('');
                setTitle('');
                setLocation('');
                setIndustry('');
                setSearchResults([]);
                setSelectedPerson(null);
              }}
            >
              Clear
            </Button>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">
                  Search Results ({totalResults} total)
                </h3>
                {totalResults > searchResults.length && (
                  <p className="text-sm text-gray-500">
                    Showing {searchResults.length} of {totalResults}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Results List */}
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {searchResults.map((person) => (
                      <Card
                        key={person.uuid}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedPerson?.uuid === person.uuid
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedPerson(person)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{person.name}</p>
                            {person.job_title && person.company && (
                              <p className="text-sm text-gray-600">
                                {person.job_title} at {person.company}
                              </p>
                            )}
                            {person.location && (
                              <p className="text-xs text-gray-500">{person.location}</p>
                            )}
                          </div>
                          {person.hasContactInfo && (
                            <Badge variant="outline" className="ml-2">
                              <Mail className="w-3 h-3 mr-1" />
                              Contact
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {/* Selected Person Details */}
                <div className="border-l pl-4">
                  {selectedPerson ? (
                    renderContactInfo(selectedPerson)
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Select a person to view contact details</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
