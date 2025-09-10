
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, Save, User, UserCheck, GraduationCap, Users, CalendarDays, Hash } from 'lucide-react';
import { generateStudentNumber, calculateAge } from '@/lib/database';

interface StudentFormProps {
  open: boolean;
  onClose: () => void;
  student?: any;
  onSave: (student: any) => void;
}

export function StudentForm({ open, onClose, student, onSave }: StudentFormProps) {
  const [formData, setFormData] = useState({
    studentNumber: student?.studentNumber || generateStudentNumber(),
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    birthDate: student?.birthDate || '',
    age: student?.age || 0,
    gender: student?.gender || '',
    level: student?.level || '',
    school: student?.school || '',
    status: student?.status || 'nouveau',
    type: student?.type || 'externe',
    isOrphan: student?.isOrphan || false,
    isNeedy: student?.isNeedy || false,
    enrollmentDate: student?.enrollmentDate || new Date().toISOString().split('T')[0],
    schoolYearId: student?.schoolYearId || 1,
    photo: student?.photo || null,
    guardian: {
      firstName: student?.guardian?.firstName || '',
      lastName: student?.guardian?.lastName || '',
      phone: student?.guardian?.phone || '',
      relationship: student?.guardian?.relationship || 'parent',
      address: student?.guardian?.address || ''
    },
    notes: student?.notes || ''
  });

  const [photoPreview, setPhotoPreview] = useState(student?.photo || null);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    if (field === 'birthDate') {
      const age = value ? calculateAge(value as string) : 0;
      setFormData(prev => ({
        ...prev,
        [field]: value,
        age: age
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleGuardianChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      guardian: {
        ...prev.guardian,
        [field]: value
      }
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 5MB');
        return;
      }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studentData = {
      ...formData,
      id: student?.id || Date.now(),
    };
    onSave(studentData);
    onClose();
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    return 'ET';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-cyan-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] bg-clip-text text-transparent">
            <GraduationCap className="w-6 h-6 text-[#7B68EE]" />
            {student ? 'Modifier l\'étudiant' : 'Inscription d\'un nouvel étudiant'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Numéro d'étudiant et Photo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Numéro d'étudiant */}
            <Card className="border-[#7B68EE]/20 bg-gradient-to-r from-white to-[#7B68EE]/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#7B68EE]">
                  <Hash className="w-5 h-5" />
                  Numéro d'étudiant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Numéro d'étudiant (généré automatiquement)</Label>
                  <Input
                    value={formData.studentNumber}
                    readOnly
                    className="bg-gray-100 font-mono text-lg font-bold text-center"
                  />
                  <p className="text-xs text-gray-500">
                    Ce numéro unique permet d'identifier et rechercher l'étudiant facilement
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Photo de profil */}
            <Card className="border-[#7B68EE]/20 bg-gradient-to-r from-white to-[#7B68EE]/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#7B68EE]">
                  <User className="w-5 h-5" />
                  Photo de profil
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
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
              </CardContent>
            </Card>
          </div>

          {/* Informations personnelles */}
          <Card className="border-[#6495ED]/20 bg-gradient-to-r from-white to-[#6495ED]/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#6495ED]">
                <UserCheck className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-[#6495ED] font-medium">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className="focus:ring-[#6495ED] focus:border-[#6495ED] border-[#6495ED]/30"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[#6495ED] font-medium">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className="focus:ring-[#6495ED] focus:border-[#6495ED] border-[#6495ED]/30"
                />
              </div>
              <div>
                <Label htmlFor="birthDate" className="text-[#6495ED] font-medium">Date de naissance *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  required
                  className="focus:ring-[#6495ED] focus:border-[#6495ED] border-[#6495ED]/30"
                />
              </div>
              <div>
                <Label htmlFor="age">Âge (calculé automatiquement)</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  readOnly
                  className="bg-gray-100 focus:ring-[#7B68EE] focus:border-[#7B68EE]"
                />
              </div>
              <div>
                <Label htmlFor="gender">Genre</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className="focus:ring-[#7B68EE] focus:border-[#7B68EE]">
                    <SelectValue placeholder="Sélectionner le genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculin">Masculin</SelectItem>
                    <SelectItem value="féminin">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="level">Niveau scolaire *</Label>
                <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                  <SelectTrigger className="focus:ring-[#7B68EE] focus:border-[#7B68EE]">
                    <SelectValue placeholder="Sélectionner le niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CP">CP</SelectItem>
                    <SelectItem value="CE1">CE1</SelectItem>
                    <SelectItem value="CE2">CE2</SelectItem>
                    <SelectItem value="CM1">CM1</SelectItem>
                    <SelectItem value="CM2">CM2</SelectItem>
                    <SelectItem value="6ème">6ème</SelectItem>
                    <SelectItem value="5ème">5ème</SelectItem>
                    <SelectItem value="4ème">4ème</SelectItem>
                    <SelectItem value="3ème">3ème</SelectItem>
                    <SelectItem value="2nde">2nde</SelectItem>
                    <SelectItem value="1ère">1ère</SelectItem>
                    <SelectItem value="Terminale">Terminale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="school">École *</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  required
                  className="focus:ring-[#7B68EE] focus:border-[#7B68EE]"
                />
              </div>
              <div>
                <Label htmlFor="status">Statut de l'étudiant</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="focus:ring-[#7B68EE] focus:border-[#7B68EE]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nouveau">Nouveau (première inscription)</SelectItem>
                    <SelectItem value="ancien">Ancien (déjà inscrit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type de scolarité</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="focus:ring-[#7B68EE] focus:border-[#7B68EE]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="externe">Externe</SelectItem>
                    <SelectItem value="interne">Interne</SelectItem>
                    <SelectItem value="demi-pensionnaire">Demi-pensionnaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Situation sociale et réductions */}
          <Card className="border-[#FF6B6B]/20 bg-gradient-to-r from-white to-[#FF6B6B]/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#FF6B6B]">
                <CalendarDays className="w-5 h-5" />
                Situation sociale et réductions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isOrphan"
                    checked={formData.isOrphan}
                    onCheckedChange={(checked) => handleInputChange('isOrphan', checked)}
                  />
                  <Label htmlFor="isOrphan" className="text-sm font-medium">
                    Étudiant orphelin (éligible aux réductions)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isNeedy"
                    checked={formData.isNeedy}
                    onCheckedChange={(checked) => handleInputChange('isNeedy', checked)}
                  />
                  <Label htmlFor="isNeedy" className="text-sm font-medium">
                    Famille nécessiteuse (éligible aux exonérations)
                  </Label>
                </div>
              </div>
              <div>
                <Label htmlFor="enrollmentDate">Date d'inscription</Label>
                <Input
                  id="enrollmentDate"
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) => handleInputChange('enrollmentDate', e.target.value)}
                  className="focus:ring-[#7B68EE] focus:border-[#7B68EE]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informations du tuteur */}
          <Card className="border-[#87CEFA]/20 bg-gradient-to-r from-white to-[#87CEFA]/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#4B9CD3]">
                <Users className="w-5 h-5" />
                Informations du tuteur
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardianFirstName">Prénom du tuteur *</Label>
                <Input
                  id="guardianFirstName"
                  value={formData.guardian.firstName}
                  onChange={(e) => handleGuardianChange('firstName', e.target.value)}
                  required
                  className="focus:ring-[#7B68EE] focus:border-[#7B68EE]"
                />
              </div>
              <div>
                <Label htmlFor="guardianLastName">Nom du tuteur *</Label>
                <Input
                  id="guardianLastName"
                  value={formData.guardian.lastName}
                  onChange={(e) => handleGuardianChange('lastName', e.target.value)}
                  required
                  className="focus:ring-[#7B68EE] focus:border-[#7B68EE]"
                />
              </div>
              <div>
                <Label htmlFor="guardianPhone">Numéro de téléphone *</Label>
                <Input
                  id="guardianPhone"
                  value={formData.guardian.phone}
                  onChange={(e) => handleGuardianChange('phone', e.target.value)}
                  required
                  className="focus:ring-[#7B68EE] focus:border-[#7B68EE]"
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relation *</Label>
                <Select value={formData.guardian.relationship} onValueChange={(value) => handleGuardianChange('relationship', value)}>
                  <SelectTrigger className="focus:ring-[#7B68EE] focus:border-[#7B68EE]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="papa">Papa</SelectItem>
                    <SelectItem value="maman">Maman</SelectItem>
                    <SelectItem value="oncle">Oncle</SelectItem>
                    <SelectItem value="tante">Tante</SelectItem>
                    <SelectItem value="frère">Frère</SelectItem>
                    <SelectItem value="sœur">Sœur</SelectItem>
                    <SelectItem value="grand-parent">Grand-parent</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="guardianAddress">Adresse</Label>
                <Textarea
                  id="guardianAddress"
                  value={formData.guardian.address}
                  onChange={(e) => handleGuardianChange('address', e.target.value)}
                  className="focus:ring-[#7B68EE] focus:border-[#7B68EE]"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes additionnelles */}
          <Card className="border-[#7B68EE]/20 bg-gradient-to-r from-white to-[#7B68EE]/5">
            <CardHeader>
              <CardTitle className="text-[#7B68EE]">Notes additionnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notes ou commentaires sur l'étudiant..."
                className="focus:ring-[#7B68EE] focus:border-[#7B68EE] border-[#7B68EE]/30"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#7B68EE]/30 text-[#7B68EE] hover:bg-[#7B68EE]/10">
              Annuler
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] hover:from-[#6B58DE] hover:to-[#3B8CC3] shadow-lg">
              <Save className="w-4 h-4 mr-2" />
              {student ? 'Modifier' : 'Enregistrer l\'inscription'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
