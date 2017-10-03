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
        public int id { get; set; }
        public string name { get; set; }
        public bool isFolder { get; set; }

        public virtual ICollection<TreeEntry> Children { get; set; }
        public TreeEntry Parent { get; set; }
    }

    /*
    public class ParentChildPair
    {   
        public int id { get; set; }

        [Required]
        public TreeEntry Parent { get; set; }
        public TreeEntry Child { get; set; }
    }*/

    public class FileTreeContext: DbContext
    {
        public DbSet<TreeEntry> TreeEntries { get; set; }
        //public DbSet<ParentChildPair> ParentChildPairs { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<TreeEntry>().HasMany(t => t.Children).WithOptional(t => t.Parent);
        }
    }

}