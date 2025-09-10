
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Send, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NotificationFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (notification: any) => void;
}

export function NotificationForm({ open, onClose, onSave }: NotificationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: '',
    priority: 'medium',
    recipients: [] as string[],
    sendNow: true,
    scheduledDate: new Date()
  });

  const recipientOptions = [
    'Tous les parents',
    'Tous les étudiants',
    'Personnel enseignant',
    'Administration',
    'Direction',
    'Parents en retard de paiement',
    'Parents CM1',
    'Parents CM2',
    'Parents 6ème',
    'Parents 4ème'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const notificationData = {
      id: Date.now(),
      title: formData.title,
      message: formData.message,
      type: formData.type,
      priority: formData.priority,
      recipients: formData.recipients,
      status: formData.sendNow ? 'sent' : 'scheduled',
      sentAt: formData.sendNow ? new Date().toISOString() : undefined,
      scheduledFor: !formData.sendNow ? formData.scheduledDate.toISOString() : undefined,
      createdAt: new Date().toISOString(),
      sentBy: 'Administration',
      readCount: 0,
      totalRecipients: formData.recipients.length * 25 // Estimation
    };

    onSave(notificationData);
    setFormData({
      title: '',
      message: '',
      type: '',
      priority: 'medium',
      recipients: [],
      sendNow: true,
      scheduledDate: new Date()
    });
    onClose();
  };

  const handleRecipientChange = (recipient: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, recipients: [...prev.recipients, recipient] }));
    } else {
      setFormData(prev => ({ ...prev, recipients: prev.recipients.filter(r => r !== recipient) }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-[#7B68EE]/5 border-[#7B68EE]/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] bg-clip-text text-transparent">
            Nouvelle Notification
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[#7B68EE] font-medium">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de la notification"
                required
                className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#7B68EE] font-medium">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))} required>
                <SelectTrigger className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90">
                  <SelectValue placeholder="Type de notification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">Paiement</SelectItem>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="alert">Alerte</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="reminder">Rappel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-[#7B68EE] font-medium">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Contenu détaillé de la notification..."
              rows={4}
              required
              className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#7B68EE] font-medium">Priorité</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[#7B68EE] font-medium">Destinataires *</Label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-r from-[#7B68EE]/5 to-[#6495ED]/5 rounded-lg border border-[#7B68EE]/20">
              {recipientOptions.map((recipient) => (
                <div key={recipient} className="flex items-center space-x-2">
                  <Checkbox
                    id={recipient}
                    checked={formData.recipients.includes(recipient)}
                    onCheckedChange={(checked) => handleRecipientChange(recipient, checked as boolean)}
                    className="border-[#7B68EE]/50 data-[state=checked]:bg-[#7B68EE] data-[state=checked]:border-[#7B68EE]"
                  />
                  <Label htmlFor={recipient} className="text-sm font-medium text-gray-700">
                    {recipient}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4 bg-gradient-to-r from-[#6495ED]/5 to-[#87CEFA]/5 rounded-lg border border-[#6495ED]/20">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendNow"
                checked={formData.sendNow}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendNow: checked as boolean }))}
                className="border-[#6495ED]/50 data-[state=checked]:bg-[#6495ED] data-[state=checked]:border-[#6495ED]"
              />
              <Label htmlFor="sendNow" className="text-[#6495ED] font-medium flex items-center gap-2">
                <Send className="w-4 h-4" />
                Envoyer immédiatement
              </Label>
            </div>

            {!formData.sendNow && (
              <div className="space-y-2">
                <Label className="text-[#6495ED] font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Programmer pour plus tard
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-[#6495ED]/30 hover:bg-[#6495ED]/10",
                        !formData.scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#6495ED]" />
                      {formData.scheduledDate ? format(formData.scheduledDate, "PPP", { locale: fr }) : "Sélectionner la date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, scheduledDate: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
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
              disabled={formData.recipients.length === 0}
            >
              {formData.sendNow ? 'Envoyer' : 'Programmer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
