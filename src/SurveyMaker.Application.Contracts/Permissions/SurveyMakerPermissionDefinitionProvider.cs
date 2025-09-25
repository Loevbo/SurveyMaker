using SurveyMaker.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using Volo.Abp.MultiTenancy;

namespace SurveyMaker.Permissions;

public class SurveyMakerPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(SurveyMakerPermissions.GroupName);

        var booksPermission = myGroup.AddPermission(SurveyMakerPermissions.Books.Default, L("Permission:Books"));
        booksPermission.AddChild(SurveyMakerPermissions.Books.Create, L("Permission:Books.Create"));
        booksPermission.AddChild(SurveyMakerPermissions.Books.Edit, L("Permission:Books.Edit"));
        booksPermission.AddChild(SurveyMakerPermissions.Books.Delete, L("Permission:Books.Delete"));
        //Define your own permissions here. Example:
        //myGroup.AddPermission(SurveyMakerPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<SurveyMakerResource>(name);
    }
}
