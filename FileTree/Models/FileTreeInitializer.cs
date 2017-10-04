using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;


namespace FileTree.Models
{
    public class FileTreeInitializer : DropCreateDatabaseIfModelChanges<FileTreeContext>
    {

        protected override void Seed(FileTreeContext context)
        {
            base.Seed(context);
            var treeEntry = new TreeEntry
            {
                Name = "/",
                IsFolder = true
            };

            var home = new TreeEntry { Name = "home/", IsFolder = true };
            var usr = new TreeEntry { Name = "usr/", IsFolder = true };
            treeEntry.Children = new List<TreeEntry> {
                usr,
                home,
                new TreeEntry { Name = "var/", IsFolder = true },
                new TreeEntry { Name = "tmp/", IsFolder = true },
                new TreeEntry { Name = "fstab", IsFolder = false }
            };
            usr.Children = new List<TreeEntry>
            {
                new TreeEntry { Name = "bin/", IsFolder=true},
                new TreeEntry { Name = "local/", IsFolder = true },
                new TreeEntry { Name = "someFile", IsFolder = false }
            };
            home.Children = new List<TreeEntry>
            {
                new TreeEntry { Name = ".zshrc", IsFolder = false },
                new TreeEntry { Name = "Downloads/", IsFolder=true},
                new TreeEntry { Name = "Images/", IsFolder = true },
                new TreeEntry { Name = ".config/", IsFolder = true }
            };
            context.TreeEntries.Add(treeEntry);
        }
    }
}