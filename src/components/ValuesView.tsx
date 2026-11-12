import React from 'react';
import {
  Heart,
  Compass,
  Globe,
  Sparkles,
  Shield,
  UserCheck,
  Sun,
  CheckCircle,
  Users,
  Target,
  BookOpen,
} from 'lucide-react';
import { storageService } from '../services/storage';
import { MemberPhoto } from './MemberPhoto';

export const ValuesView: React.FC = () => {
  const config = storageService.getPublishedConfig();

  const fourLevels = [
    {
      title: '1. Harmony in Self',
      icon: UserCheck,
      desc: 'Clarity in understanding, desire-thought alignment, and conscious natural acceptance.',
    },
    {
      title: '2. Harmony in Family',
      icon: Heart,
      desc: 'Living with trust, respect, affection, care, and mutual fulfillment in human relationships.',
    },
    {
      title: '3. Harmony in Society',
      icon: Shield,
      desc: 'Fearlessness, mutual trust, ethical cooperation, and responsibility beyond self-interest.',
    },
    {
      title: '4. Harmony in Nature',
      icon: Globe,
      desc: 'Mutual enrichment and co-existence with all orders: material, plant, animal, and human.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 animate-fade-in space-y-12">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          {config.branding.institutionName}
        </div>
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900">
          Universal Human Values & Co-Existence
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          The UHV Cell guides engineering students from reactionary living to conscious living grounded in mutual happiness, mutual prosperity, and ethical excellence.
        </p>
      </div>

      {/* Hero Quote Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0f2942] text-white text-center shadow-lg relative overflow-hidden">
        <Sun className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white mb-2">
          “{config.branding.headerSlogan || 'Existence is Co-Existence'}”
        </h2>
        <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
          Nature is organized as interconnected, complementary units in space. Harmony is inherently present in existence; human beings only need to understand, verify, and align with it.
        </p>
      </div>

      {/* Institutional Vision & Mission (Dynamic CMS Data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0f2942] uppercase tracking-wider">
            <Target className="w-4 h-4 text-amber-600" />
            Institutional Vision
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {config.about.vision}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0f2942] uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-amber-600" />
            Cell Mission & Guidelines
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {config.about.mission}
          </p>
        </div>
      </div>

      {/* 4 Levels of Living */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#0f2942]" />
          The Four Levels of Human Living
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fourLevels.map((lvl) => {
            const Icon = lvl.icon;
            return (
              <div
                key={lvl.title}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">{lvl.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{lvl.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nine Fundamental Human Values (Dynamic from config.values) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            The Nine Fundamental Values of Relationship
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            AICTE Universal Human Values Guidelines
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.values.map((v, idx) => (
            <div
              key={v.id || v.name}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-[#0f2942] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    0{idx + 1}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {v.category}
                  </span>
                </div>

                <div className="font-bold text-sm text-[#0f2942] mb-0.5">
                  {v.name}
                </div>
                {v.englishMeaning && (
                  <div className="text-xs font-semibold text-amber-700 mb-2">
                    {v.englishMeaning}
                  </div>
                )}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {v.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Objectives */}
      {config.about.objectives && config.about.objectives.length > 0 && (
        <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#0f2942]" />
            Key Objectives of UHV Cell – NBKRIST
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {config.about.objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leadership & Advisory Committee */}
      {config.about.leadership && config.about.leadership.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0f2942]" />
            Leadership & Advisory Committee
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config.about.leadership.map((leader) => (
              <div
                key={leader.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <MemberPhoto
                      photoUrl={leader.photoUrl}
                      name={leader.name}
                      size="sm"
                      shape="circle"
                      className="border border-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{leader.name}</h4>
                      <span className="text-[11px] font-semibold text-[#0f2942] block">
                        {leader.role}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {leader.department}
                      </span>
                    </div>
                  </div>

                  {leader.message && (
                    <p className="text-xs text-slate-600 italic border-t border-slate-100 pt-2 leading-relaxed">
                      &ldquo;{leader.message}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
