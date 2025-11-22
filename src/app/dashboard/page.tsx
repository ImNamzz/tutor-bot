"use client";
import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import EventWidget from "./components/EventWidget";
import { AddClassModal } from "./components/AddClassModal";
import { ClassCard } from "./components/ClassCard";
import { ClassItem } from "@/app/lib/types/class";
import { API_ENDPOINTS } from "@/app/lib/config";
import { getAccessToken, handleAuthError } from "@/app/lib/auth";
import { toast } from "sonner";
import {
  CalendarDays,
  Activity,
  AlarmClock,
  Search,
  Filter,
} from "lucide-react";

const STORAGE_KEY = "eduassist_classes";
const COLORS_KEY = "eduassist_class_colors";

export default function DashboardPage() {
  // Mock events for the EventWidget
  const MOCK_EVENTS = [
    {
      id: "evt-1",
      title: "Meeting with AI Tutor",
      description:
        "Discuss progress on recent problem sets and clarify doubts about calculus.",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: "evt-2",
      title: "Review Class Notes",
      description:
        "Go through week 3 lecture notes on thermodynamics and summarize key formulas.",
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toLocaleTimeString(),
    },
    {
      id: "evt-3",
      title: "Physics Assignment Deadline",
      description: "Submit assignment on projectile motion before midnight.",
      timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString(),
    },
    {
      id: "evt-4",
      title: "Group Study Session",
      description:
        "Collaborative session on linear algebra problem set with peers.",
      timestamp: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleTimeString(),
    },
  ];
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "upcoming" | "ended"
  >("all");
  const [classColors, setClassColors] = useState<Record<string, string>>({});
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [classGroups, setClassGroups] = useState<any[]>([]);

  // Load colors from localStorage and then fetch classes
  useEffect(() => {
    setMounted(true);
    
    // Load colors first
    try {
      const savedColors = localStorage.getItem(COLORS_KEY);
      if (savedColors) {
        const colors = JSON.parse(savedColors);
        setClassColors(colors);
        // Fetch classes with the loaded colors
        fetchClasses(colors);
      } else {
        // No saved colors, just fetch classes
        fetchClasses({});
      }
    } catch (e) {
      console.error("Failed to load class colors", e);
      fetchClasses({});
    }

    // Fetch action items for the Events widget
    fetchActionItems();
  }, []);

  // Rebuild class groups when either classes or actionItems change
  useEffect(() => {
    if (classes.length > 0 && actionItems.length > 0) {
      buildClassGroups(actionItems, classes);
    } else if (classes.length > 0) {
      // Even if no action items, show the class structure
      const emptyGroups = classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        color: classColors[cls.id] || '#8b5cf6',
        lectures: cls.lectures.map(lec => ({
          id: lec.id,
          title: lec.title,
          action_items: []
        }))
      }));
      setClassGroups(emptyGroups);
    }
  }, [classes, actionItems]);

  // Save colors to localStorage whenever they change
  const saveColor = (classId: string, color: string) => {
    const newColors = { ...classColors, [classId]: color };
    setClassColors(newColors);
    try {
      localStorage.setItem(COLORS_KEY, JSON.stringify(newColors));
    } catch (e) {
      console.error("Failed to save class colors", e);
    }
  };

  const fetchActionItems = async () => {
    try {
      console.log('📦 Fetching action items from:', API_ENDPOINTS.actionItems);
      const response = await fetch(API_ENDPOINTS.actionItems, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      console.log('📦 Response status:', response.status);

      if (response.ok) {
        const items = await response.json();
        console.log('📦 Raw action items from API:', items);
        
        // Transform to flat list for backward compatibility
        const eventItems = items.map((item: any) => {
          const createdAt = item.created_at ? new Date(item.created_at) : new Date();
          const timeString = createdAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });

          const itemTitle = item.content || item.title || item.type || 'Untitled Action Item';

          return {
            id: item.id,
            title: itemTitle,
            description: item.lecture?.title ? `From lecture: ${item.lecture.title}` : 'Action Item',
            timestamp: timeString,
            isSeen: item.completed || false,
            lectureId: item.lecture_id,
            userId: item.user_id
          };
        });

        setActionItems(eventItems);
        
        // Build hierarchical structure from classes and action items
        buildClassGroups(eventItems);
      } else {
        console.error('✗ Failed to fetch action items, status:', response.status);
        setActionItems([]);
        setClassGroups([]);
      }
    } catch (error) {
      console.error('✗ Error fetching action items:', error);
      setActionItems([]);
      setClassGroups([]);
    }
  };

  const buildClassGroups = (items: any[], classesData?: ClassItem[]) => {
    const dataToUse = classesData || classes;
    
    console.log('🏗️ Building class groups with:', {
      itemsCount: items.length,
      classesCount: dataToUse.length,
      items: items.map(i => ({ id: i.id, lectureId: i.lectureId, title: i.title }))
    });

    // Build a map of lecture_id -> action items
    const itemsByLecture = new Map<string, any[]>();
    items.forEach(item => {
      // Try different possible field names for lecture_id
      const lectureId = item.lectureId || item.lecture_id;
      console.log(`  Item "${item.title}": lectureId=${lectureId}`);
      
      if (lectureId) {
        if (!itemsByLecture.has(lectureId)) {
          itemsByLecture.set(lectureId, []);
        }
        itemsByLecture.get(lectureId)!.push({
          id: item.id,
          title: item.title,
          description: item.description,
          timestamp: item.timestamp,
          isSeen: item.isSeen
        });
      }
    });

    console.log('📚 Items by lecture:', Object.fromEntries(itemsByLecture));

    // Build class groups with lectures
    const groups = dataToUse.map(cls => {
      const lectures = cls.lectures.map(lec => ({
        id: lec.id,
        title: lec.title,
        action_items: itemsByLecture.get(lec.id) || []
      }));

      return {
        id: cls.id,
        name: cls.name,
        color: classColors[cls.id] || '#8b5cf6',
        lectures
      };
    }).filter(cls => cls.lectures.some(l => l.action_items.length > 0));

    console.log('🏗️ Built class groups:', groups);
    setClassGroups(groups);
  };

  const fetchClasses = async (colors: Record<string, string> = classColors) => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.classes, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();
      
      // Transform backend data to match ClassItem interface
      const transformedClasses = data.map((cls: any) => ({
        id: cls.id,
        name: cls.title,
        code: cls.code || '',
        color: colors[cls.id] || '#6366f1', // Use saved color or default
        lectures: cls.lectures?.map((lec: any) => ({
          id: lec.id,
          title: lec.title,
          createdAt: lec.created_at,
          status: lec.status
        })) || [],
        createdAt: cls.created_at
      }));

      setClasses(transformedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (item: ClassItem) => {
    try {
      const response = await fetch(API_ENDPOINTS.classes, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({
          title: item.name
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        throw new Error('Failed to create class');
      }

      const newClass = await response.json();
      
      // Save the color choice to localStorage
      saveColor(newClass.id, item.color || '#6366f1');
      
      // Transform and add to local state
      const transformedClass: ClassItem = {
        id: newClass.id,
        name: newClass.title,
        code: item.code || '',
        color: item.color || '#6366f1',
        lectures: [],
        createdAt: newClass.created_at
      };

      setClasses([transformedClass, ...classes]);
      toast.success('Class created successfully');
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    }
  };

  const handleRenameClass = async (id: string, newName: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.updateClass(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({
          title: newName
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        throw new Error('Failed to update class');
      }

      const next = classes.map((c) =>
        c.id === id ? { ...c, name: newName } : c
      );
      setClasses(next);
      toast.success('Class renamed successfully');
    } catch (error) {
      console.error('Error renaming class:', error);
      toast.error('Failed to rename class');
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.deleteClass(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        throw new Error('Failed to delete class');
      }

      const next = classes.filter((c) => c.id !== id);
      setClasses(next);
      toast.success('Class deleted successfully');
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    }
  };

  // Derived helpers
  const getClassStatus = (c: ClassItem): "active" | "upcoming" | "ended" => {
    if (!c.lectures || c.lectures.length === 0) return "upcoming";
    const newest = c.lectures
      .map((l) => new Date(l.createdAt).getTime())
      .reduce((a, b) => Math.max(a, b), 0);
    const days = (Date.now() - newest) / (1000 * 60 * 60 * 24);
    return days <= 14 ? "active" : "ended";
  };

  const filteredClasses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return classes.filter((c) => {
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.code?.toLowerCase().includes(q) ?? false);
      const status = getClassStatus(c);
      const matchStatus = statusFilter === "all" || status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [classes, query, statusFilter]);

  const stats = useMemo(() => {
    const total = classes.length;
    const upcoming = classes.filter(
      (c) => getClassStatus(c) === "upcoming"
    ).length;
    const recentActivity = classes.reduce((acc, c) => {
      return (
        acc +
        c.lectures.filter(
          (l) =>
            (Date.now() - new Date(l.createdAt).getTime()) /
              (1000 * 60 * 60 * 24) <=
            7
        ).length
      );
    }, 0);
    return { total, upcoming, recentActivity };
  }, [classes]);

  return (
    <div className="min-h-screen bg-background dark:bg-[#000000] transition-colors">
      {/* Fixed Topbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 dark:bg-[#000000]/80 backdrop-blur-sm border-b border-border dark:border-border">
        <Topbar />
      </nav>
      {/* Main content offset by topbar height */}
      <main className="pt-24 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <AddClassModal onAdd={handleAddClass} />
            </div>
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div className="rounded-xl border border-border bg-card dark:bg-[#1a1a1a] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-secondary text-primary flex items-center justify-center dark:bg-indigo-950/40">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Total Classes
                    </div>
                    <div className="text-lg font-semibold">{stats.total}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card dark:bg-[#1a1a1a] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                    <AlarmClock className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Upcoming Classes
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.upcoming}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card dark:bg-[#1a1a1a] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Recent Activity
                    </div>
                    <div className="text-lg font-semibold">
                      {stats.recentActivity}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search classes..."
                  className="w-full rounded-lg border border-border bg-background dark:bg-[#1a1a1a] pl-9 pr-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  className="rounded-lg border border-border bg-background dark:bg-[#1a1a1a] px-2 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>

            {mounted && filteredClasses.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                No classes match your filters.
              </p>
            )}
            {loading && (
              <p className="text-sm text-muted-foreground">
                Loading classes...
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredClasses.map((c) => (
                <ClassCard
                  key={c.id}
                  item={c}
                  onRename={handleRenameClass}
                  onDelete={handleDeleteClass}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* EventWidget mounted at the root level to allow free dragging */}
      <EventWidget items={actionItems} classGroups={classGroups} />
    </div>
  );
}
