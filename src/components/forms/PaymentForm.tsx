
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Euro, Calendar, Receipt, Search, User } from 'lucide-react';

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  payment?: any;
  onSave: (payment: any) => void;
  students: any[];
}

export function PaymentForm({ open, onClose, payment, onSave, students }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    studentId: payment?.studentId || '',
    amount: payment?.amount || '',
    period: payment?.period || '',
    type: payment?.type || 'scolarité',
    method: payment?.method || 'espèces',
    date: payment?.date || new Date().toISOString().split('T')[0],
    notes: payment?.notes || ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  React.useEffect(() => {
    if (payment?.studentId) {
      const student = students.find(s => s.id === payment.studentId);
      if (student) {
        setSelectedStudent(student);
        setSearchTerm(`${student.firstName} ${student.lastName}`);
      }
    }
  }, [payment, students]);

  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paymentTypes = [
    { value: 'scolarité', label: 'Frais de scolarité' },
    { value: 'pension', label: 'Pension complète' },
    { value: 'demi-pension', label: 'Demi-pension' },
    { value: 'transport', label: 'Transport' },
    { value: 'uniforme', label: 'Uniforme' },
    { value: 'fournitures', label: 'Fournitures scolaires' },
    { value: 'activités', label: 'Activités extra-scolaires' },
    { value: 'autre', label: 'Autre' }
  ];

  const paymentMethods = [
    { value: 'espèces', label: 'Espèces' },
    { value: 'chèque', label: 'Chèque' },
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'mobile', label: 'Paiement mobile' }
  ];

  const generatePeriods = () => {
    const periods = [];
    const currentYear = new Date().getFullYear();
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    // Générer les mois de l'année actuelle et suivante
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      months.forEach(month => {
        periods.push(`${month} ${year}`);
      });
    }
    
    return periods;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      studentId: student.id
    }));
    setSearchTerm(`${student.firstName} ${student.lastName}`);
  };

  const calculateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REC-${year}-${random}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const paymentData = {
      ...formData,
      id: payment?.id || Date.now().toString(),
      amount: parseFloat(formData.amount),
      receiptNumber: payment?.receiptNumber || calculateReceiptNumber(),
      student: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
      status: 'Payé'
    };
    onSave(paymentData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-cyan-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] bg-clip-text text-transparent">
            <CreditCard className="w-6 h-6 text-[#7B68EE]" />
            {payment ? 'Modifier le paiement' : 'Nouveau paiement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de l'étudiant */}
          <Card className="border-[#7B68EE]/20 bg-gradient-to-r from-white to-[#7B68EE]/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#7B68EE]">
                <User className="w-5 h-5" />
                Sélection de l'étudiant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un étudiant par nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 focus:ring-[#7B68EE] focus:border-[#7B68EE] border-[#7B68EE]/30"
                />
              </div>
              
              {searchTerm && !selectedStudent && (
                <div className="max-h-40 overflow-y-auto border rounded-lg border-[#7B68EE]/20">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 hover:bg-[#7B68EE]/10 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleStudentSelect(student)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-gray-500">{student.level} - {student.school}</p>
                        </div>
                        <Badge variant="outline" className="border-[#7B68EE]/30">{student.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedStudent && (
                <div className="p-4 bg-gradient-to-r from-[#7B68EE]/10 to-[#4B9CD3]/10 rounded-lg border border-[#7B68EE]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                      <p className="text-sm text-gray-600">{selectedStudent.level} - {selectedStudent.school}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(null);
                        setSearchTerm('');
                        setFormData(prev => ({ ...prev, studentId: '' }));
                      }}
                      className="border-[#7B68EE]/30 hover:bg-[#7B68EE]/10"
                    >
                      Changer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations du paiement */}
          <Card className="border-[#6495ED]/20 bg-gradient-to-r from-white to-[#6495ED]/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#6495ED]">
                <Euro className="w-5 h-5" />
                Détails du paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="text-[#6495ED] font-medium">Montant (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                  className="focus:ring-[#7B68EE] focus:border-[#7B68EE] border-[#7B68EE]/30"
                />
              </div>
              <div>
                <Label htmlFor="period" className="text-[#6495ED] font-medium">Période *</Label>
                <Select value={formData.period} onValueChange={(value) => handleInputChange('period', value)}>
                  <SelectTrigger className="focus:ring-[#7B68EE] focus:border-[#7B68EE] border-[#7B68EE]/30">
                    <SelectValue placeholder="Sélectionner la période" />
                  </SelectTrigger>
                  <SelectContent>
                    {generatePeriods().map((period) => (
                      <SelectItem key={period} value={period}>{period}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type" className="text-[#6495ED] font-medium">Type de paiement *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="focus:ring-[#7B68EE] focus:border-[#7B68EE] border-[#7B68EE]/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="method" className="text-[#6495ED] font-medium">Méthode de paiement *</Label>
                <Select value={formData.method} onValueChange={(value) => handleInputChange('method', value)}>
                  <SelectTrigger className="focus:ring-[#7B68EE] focus:border-[#7B68EE] border-[#7B68EE]/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="date" className="text-[#6495ED] font-medium">Date de paiement</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="focus:ring-[#7B68EE] focus:border-[#7B68EE] border-[#7B68EE]/30"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes" className="text-[#6495ED] font-medium">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Notes ou commentaires..."
                  className="focus:ring-[#7B68EE] focus:border-[#7B68EE] border-[#7B68EE]/30"
                />
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-[#7B68EE]/30 text-[#7B68EE] hover:bg-[#7B68EE]/10">
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] hover:from-[#6B58DE] hover:to-[#3B8CC3] shadow-lg" 
              disabled={!selectedStudent}
            >
              <Receipt className="w-4 h-4 mr-2" />
              {payment ? 'Modifier' : 'Enregistrer'} le paiement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
