'use client';

import { useState } from 'react';
import { JobPost, JobType, PayType } from '@/src/types';
import { jobsStore } from '@/src/lib/jobs';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { ImageUpload } from './ui/ImageUpload';

interface EditJobFormProps {
  job: JobPost;
  onSave: () => void;
  onCancel: () => void;
}

export const EditJobForm = ({ job, onSave, onCancel }: EditJobFormProps) => {
  const [formData, setFormData] = useState({
    title: job.title,
    type: job.type,
    location: job.location,
    date: job.date instanceof Date ? job.date.toISOString().split('T')[0] : new Date(job.date).toISOString().split('T')[0],
    duration: job.duration,
    payAmount: job.payAmount?.toString() || '',
    payType: job.payType,
    description: job.description,
    deliverables: job.deliverables.join('\n'),
    referenceImages: job.referenceImages,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mettre à jour l'annonce
    jobsStore.update(job.id, {
      title: formData.title,
      type: formData.type,
      location: formData.location,
      date: new Date(formData.date),
      duration: formData.duration,
      payAmount: formData.payType === 'PAID' && formData.payAmount ? parseFloat(formData.payAmount) : null,
      payType: formData.payType,
      description: formData.description,
      deliverables: formData.deliverables
        .split('\n')
        .map((d) => d.trim())
        .filter((d) => d.length > 0),
      referenceImages: formData.referenceImages,
    });

    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">Titre</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">Type</label>
        <Tabs
          defaultValue={formData.type}
          value={formData.type}
          onValueChange={(v) => setFormData({ ...formData, type: v as JobType })}
        >
          <TabsList>
            <TabsTrigger value="FASHION">Mode</TabsTrigger>
            <TabsTrigger value="BEAUTY">Beauté</TabsTrigger>
            <TabsTrigger value="COMMERCIAL">Commercial</TabsTrigger>
            <TabsTrigger value="EDITORIAL">Éditorial</TabsTrigger>
            <TabsTrigger value="OTHER">Autre</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">Lieu</label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Date</label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Durée</label>
          <Input
            placeholder="ex: 4h, 1 jour"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">Rémunération</label>
        <Tabs
          value={formData.payType}
          onValueChange={(v) => setFormData({ ...formData, payType: v as PayType })}
        >
          <TabsList>
            <TabsTrigger value="PAID">Rémunéré</TabsTrigger>
            <TabsTrigger value="UNPAID">Collaboration</TabsTrigger>
          </TabsList>
        </Tabs>
        {formData.payType === 'PAID' && (
          <Input
            type="number"
            placeholder="Montant en €"
            value={formData.payAmount}
            onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
            className="mt-2"
          />
        )}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">Description</label>
        <textarea
          className="w-full rounded-lg border border-beige-300 p-3 focus:border-beige-500 focus:ring-2 focus:ring-beige-500/20"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Livrables (un par ligne)
        </label>
        <textarea
          className="w-full rounded-lg border border-beige-300 p-3 focus:border-beige-500 focus:ring-2 focus:ring-beige-500/20"
          rows={3}
          value={formData.deliverables}
          onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
          placeholder="20 photos retouchées&#10;Droits usage commercial"
        />
      </div>
      <div>
        <ImageUpload
          images={formData.referenceImages}
          onChange={(images) => setFormData({ ...formData, referenceImages: images })}
          maxImages={10}
          label="Images de référence"
          multiple={true}
        />
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-beige-300 hover:bg-beige-100"
        >
          Annuler
        </Button>
        <Button type="submit" variant="beige">
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  );
};
