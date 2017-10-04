using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FileTree.Models
{
    public class TreeEntry
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsFolder { get; set; }
        public int Position { get; set; }

        public virtual List<TreeEntry> Children { get; set; }
        public TreeEntry Parent { get; set; }

        public void AddChild(TreeEntry child, int position=-1)
        {
            if (position == -1)
            {
                child.Position = this.Children.Count;
                this.Children.Add(child);
            }
            else
            {
                child.Position = position;
                foreach (var treeEntry in this.Children.Where(x => x.Position >= position))
                {
                    treeEntry.Position += 1;
                }
                this.Children.Insert(position, child);
            }
        }

        public bool RemoveFromParent()
        {
            if (this.Parent != null)
            {
                var position = this.Position;
                foreach (var treeEntry in this.Parent.Children.Where(x => x.Position > position))
                {
                    treeEntry.Position -= 1;
                }
            
                return this.Parent.Children.Remove(this);
            }
            return false;
        }

    }

    public class FileTreeContext: DbContext
    {
        public DbSet<TreeEntry> TreeEntries { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<TreeEntry>().HasMany(t => t.Children).WithOptional(t => t.Parent);
        }
    }

}