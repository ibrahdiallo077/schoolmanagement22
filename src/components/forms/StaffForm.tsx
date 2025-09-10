
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface StaffFormProps {
  open: boolean;
  onClose: () => void;
  staff?: any;
  onSave: (staff: any) => void;
}

export function StaffForm({ open, onClose, staff, onSave }: StaffFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    job: '',
    salary: '',
    startDate: new Date(),
    contractType: '',
    workDays: [] as string[],
    phone: '',
    email: '',
    gender: '',
    address: '',
    photo: null as string | null,
    createdAt: new Date().toISOString()
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const jobTypes = [
    'Directeur', 'Directrice', 'Enseignant', 'Enseignante', 'Secrétaire', 
    'Comptable', 'Surveillant', 'Surveillante', 'Maintenance', 'Cuisine', 
    'Nettoyage', 'Sécurité', 'Chauffeur', 'Autre'
  ];

  useEffect(() => {
    if (staff) {
      setFormData({
        firstName: staff.firstName || '',
        lastName: staff.lastName || '',
        job: staff.job || '',
        salary: staff.salary?.toString() || '',
        startDate: staff.startDate ? new Date(staff.startDate) : new Date(),
        contractType: staff.contractType || '',
        workDays: staff.workDays || [],
        phone: staff.phone || '',
        email: staff.email || '',
        gender: staff.gender || '',
        address: staff.address || '',
        photo: staff.photo || null,
        createdAt: staff.createdAt || new Date().toISOString()
      });
      setPhotoPreview(staff.photo || null);
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        job: '',
        salary: '',
        startDate: new Date(),
        contractType: '',
        workDays: [],
        phone: '',
        email: '',
        gender: '',
        address: '',
        photo: null,
        createdAt: new Date().toISOString()
      });
      setPhotoPreview(null);
    }
  }, [staff, open]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 5MB');
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photo: null }));
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    return 'PE';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const staffData = {
      id: staff?.id || Date.now(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      job: formData.job,
      salary: parseFloat(formData.salary),
      startDate: format(formData.startDate, 'yyyy-MM-dd'),
      contractType: formData.contractType,
      workDays: formData.workDays,
      phone: formData.phone,
      email: formData.email,
      gender: formData.gender,
      address: formData.address,
      photo: formData.photo,
      createdAt: formData.createdAt
    };

    onSave(staffData);
    onClose();
  };

  const handleWorkDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, workDays: [...prev.workDays, day] }));
    } else {
      setFormData(prev => ({ ...prev, workDays: prev.workDays.filter(d => d !== day) }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-white to-cyan-50 border-[#7B68EE]/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] bg-clip-text text-transparent">
            {staff ? 'Modifier l\'employé' : 'Nouveau membre du personnel'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo de profil */}
          <div className="p-4 bg-gradient-to-r from-[#7B68EE]/5 to-[#6495ED]/5 rounded-lg border border-[#7B68EE]/20">
            <h3 className="text-lg font-semibold text-[#7B68EE] mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Photo de profil
            </h3>
            <div className="flex items-center gap-4">
              <Avatar className="w-24 h-24 border-4 border-[#7B68EE]/20">
                <AvatarImage src={photoPreview} />
                <AvatarFallback className="bg-gradient-to-br from-[#7B68EE] to-[#4B9CD3] text-white text-lg font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" className="relative border-[#7B68EE]/30 hover:bg-[#7B68EE]/10">
                  <Upload className="w-4 h-4 mr-2" />
                  Télécharger une photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </Button>
                {photoPreview && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={removePhoto}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                )}
                <p className="text-xs text-gray-500">JPG, PNG ou GIF (max. 5MB)</p>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="p-4 bg-gradient-to-r from-[#7B68EE]/5 to-[#6495ED]/5 rounded-lg border border-[#7B68EE]/20">
            <h3 className="text-lg font-semibold text-[#7B68EE] mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#7B68EE] font-medium">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Prénom"
                  required
                  className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[#7B68EE] font-medium">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nom de famille"
                  required
                  className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#7B68EE] font-medium">Genre *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))} required>
                  <SelectTrigger className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90">
                    <SelectValue placeholder="Sélectionner le genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculin">Masculin</SelectItem>
                    <SelectItem value="Féminin">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#7B68EE] font-medium">Téléphone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+212 6 XX XX XX XX"
                  required
                  className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#7B68EE] font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemple.com"
                  required
                  className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-[#7B68EE] font-medium">Adresse</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Adresse complète"
                  className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
                />
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="p-4 bg-gradient-to-r from-[#6495ED]/5 to-[#87CEFA]/5 rounded-lg border border-[#6495ED]/20">
            <h3 className="text-lg font-semibold text-[#6495ED] mb-4">Informations professionnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#6495ED] font-medium">Poste *</Label>
                <Select value={formData.job} onValueChange={(value) => setFormData(prev => ({ ...prev, job: value }))} required>
                  <SelectTrigger className="border-[#6495ED]/30 focus:ring-[#6495ED]/50 focus:border-[#6495ED] bg-white/90">
                    <SelectValue placeholder="Sélectionner le poste" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((job) => (
                      <SelectItem key={job} value={job}>{job}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary" className="text-[#6495ED] font-medium">Salaire mensuel (€) *</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                  placeholder="3000.00"
                  required
                  className="border-[#6495ED]/30 focus:ring-[#6495ED]/50 focus:border-[#6495ED] bg-white/90"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#6495ED] font-medium">Type de contrat *</Label>
                <Select value={formData.contractType} onValueChange={(value) => setFormData(prev => ({ ...prev, contractType: value }))} required>
                  <SelectTrigger className="border-[#6495ED]/30 focus:ring-[#6495ED]/50 focus:border-[#6495ED] bg-white/90">
                    <SelectValue placeholder="Type de contrat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDI">CDI</SelectItem>
                    <SelectItem value="CDD">CDD</SelectItem>
                    <SelectItem value="Stage">Stage</SelectItem>
                    <SelectItem value="Interim">Intérim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#6495ED] font-medium">Date de début *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-[#6495ED]/30 hover:bg-[#6495ED]/10",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#6495ED]" />
                      {formData.startDate ? format(formData.startDate, "PPP", { locale: fr }) : "Date de début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Jours de travail */}
            <div className="mt-4 space-y-2">
              <Label className="text-[#6495ED] font-medium">Jours de travail *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white/50 rounded-lg border border-[#6495ED]/20">
                {weekDays.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={formData.workDays.includes(day)}
                      onCheckedChange={(checked) => handleWorkDayChange(day, checked as boolean)}
                      className="border-[#6495ED]/50 data-[state=checked]:bg-[#6495ED] data-[state=checked]:border-[#6495ED]"
                    />
                    <Label htmlFor={day} className="text-sm font-medium text-gray-700">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#7B68EE]/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-[#7B68EE]/30 text-[#7B68EE] hover:bg-[#7B68EE]/10"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] hover:from-[#6B58DE] to-[#3B8CC3] shadow-lg"
            >
              {staff ? 'Mettre à jour' : 'Ajouter l\'employé'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
